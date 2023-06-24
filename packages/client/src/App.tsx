/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	AsyncEither,
	asyncRight,
	ClientUser,
	Either,
	EitherObj,
	FileObject,
	FullTeamObject,
	HTTPError,
	Maybe,
	Member,
	MemberCreateError,
	RegistryValues,
	SigninReturn,
} from 'common-lib';
import * as React from 'react';
import { Provider } from 'react-redux';
import './App.css';
import BreadCrumbs, { BreadCrumb } from './components/BreadCrumbs';
import GlobalNotification from './components/GlobalNotification';
import Loader from './components/Loader';
import Footer from './components/page-elements/Footer';
import Header from './components/page-elements/Header';
import SideNavigation, { SideNavigationItem } from './components/page-elements/SideNavigation';
import PageRouter from './components/PageRouter';
import {
	FetchAPIProvider,
	MemberDetailsProvider,
	MemberListProvider,
	TeamListProvider,
} from './globals';
import fetchApi, { fetchAPIForAccount } from './lib/apis';
import { getMember } from './lib/Members';
import { store } from './store';
import { deletePageState } from './state/pageState';

interface AppUIState {
	sideNavLinks: SideNavigationItem[];
	breadCrumbs: BreadCrumb[];
	allowedSlideshowIDs: FileObject[];
	memberList: EitherObj<HTTPError, Member[]> | null;
	teamList: EitherObj<HTTPError, FullTeamObject[]> | null;
	isEmbedded: boolean;
}

interface UnloadedAppState {
	state: 'LOADING';
}

interface LoadedAppState {
	state: 'LOADED';

	Registry: RegistryValues;
	member: SigninReturn;
	account: AccountObject;
	fullMember: ClientUser | null;
}

interface ErrorAppState {
	state: 'ERROR';
}

type AppState = AppUIState & (ErrorAppState | UnloadedAppState | LoadedAppState);

export default class App extends React.Component<
	{
		isMobile: boolean;
	},
	AppState
> {
	public key: number | null = null;

	public state: AppState = {
		state: 'LOADING',
		sideNavLinks: [],
		breadCrumbs: [],
		allowedSlideshowIDs: [],
		memberList: null,
		teamList: null,
		isEmbedded: false,
	};

	private currentMembersListRequestInProgress = false;
	private currentTeamsListRequestInProgress = false;
	private timer: NodeJS.Timer | null = null;

	public async componentDidMount(): Promise<void> {
		const getAllowedSlideshowIDsPromise = fetchApi
			.slideshowImageIDs({}, {})
			.tap(allowedSlideshowIDs => this.setState({ allowedSlideshowIDs }))
			.fullJoin();

		const isEmbedded = !!/embed=.*?&?/.exec(window.location.search);

		if (isEmbedded) {
			document.getElementById('root')?.classList.add('embedded');
		}

		this.setState({
			isEmbedded,
		});

		const infoEither = await AsyncEither.All([
			fetchApi.accountCheck({}, {}),
			fetchApi.registry.get({}, {}),

			// The following should not fail
			asyncRight(getMember(), {
				code: 500,
				message: 'Could not get account information',
			}),
		]);

		if (Either.isLeft(infoEither)) {
			this.setState({
				state: 'ERROR',
			});
			return;
		}

		const [account, registry, member] = infoEither.value;

		if (member.error !== MemberCreateError.NONE) {
			localStorage.removeItem('sessionID');
		}

		const fullMember = member.error !== MemberCreateError.NONE ? null : member.member;

		this.setState(prev => ({
			...prev,
			Registry: registry,
			account,
			member,
			state: 'LOADED',
			fullMember,
		}));

		await getAllowedSlideshowIDsPromise;
	}

	public componentWillUnmount(): void {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}

	public render = (): JSX.Element =>
		this.renderWithProviders(
			<>
				<Header
					loadingError={this.state.state === 'ERROR'}
					registry={Maybe.fromValue(
						this.state.state === 'LOADED' ? this.state.Registry : undefined,
					)}
				/>
				{/* <Slideshow fileIDs={this.state.allowedSlideshowIDs.map(item => item.id)} /> */}
				<div className="background">
					<div className="main-content-bottom" />
				</div>
				<SideNavigation
					links={this.state.sideNavLinks}
					member={this.state.state === 'LOADED' ? this.state.fullMember : null}
					fullMemberDetails={
						this.state.state === 'LOADED'
							? this.state.member
							: {
									error: MemberCreateError.INVALID_SESSION_ID,
							  }
					}
					authorizeUser={this.authorizeUser}
				/>
				<div className="content-border left-border" />
				<main>
					<div className="main-content">
						<div id="fb-root" />
						<BreadCrumbs links={this.state.breadCrumbs} />
						{this.state.state === 'LOADED' ? (
							<GlobalNotification account={this.state.account} />
						) : null}
						{this.renderPage()}
					</div>
				</main>
				<div className="content-border right-border" />
				<Footer
					registry={Maybe.fromValue(
						this.state.state === 'LOADED' ? this.state.Registry : undefined,
					)}
				/>
			</>,
		);

	private renderWithProviders = (el: JSX.Element): JSX.Element => (
		<Provider store={store}>
			<FetchAPIProvider value={{ fetchApi, fetchAPIForAccount }}>
				<MemberDetailsProvider
					value={{
						member: this.state.state === 'LOADED' ? this.state.fullMember : null,
						fullMember:
							this.state.state === 'LOADED'
								? this.state.member
								: {
										error: MemberCreateError.INVALID_SESSION_ID,
								  },
					}}
				>
					<MemberListProvider
						value={{
							state: this.state.memberList,
							updateList: this.updateMemberList,
						}}
					>
						<TeamListProvider
							value={{
								state: this.state.teamList,
								updateList: this.updateTeamList,
							}}
						>
							{el}
						</TeamListProvider>
					</MemberListProvider>
				</MemberDetailsProvider>
			</FetchAPIProvider>
		</Provider>
	);

	private renderPage = (): JSX.Element =>
		this.state.state === 'LOADING' ? (
			<Loader />
		) : this.state.state === 'ERROR' ? (
			<div>The account does not exist</div>
		) : (
			<PageRouter
				updateApp={this.update}
				updateSideNav={this.updateSideNav}
				updateBreadCrumbs={this.updateBreadCrumbs}
				member={this.state.fullMember}
				fullMemberDetails={this.state.member}
				account={this.state.account}
				authorizeUser={this.authorizeUser}
				registry={this.state.Registry}
				key="pagerouter"
				deleteReduxState={this.deleteReduxState}
			/>
		);

	private updateSideNav = (sideNavLinks: SideNavigationItem[]): void => {
		this.setState({ sideNavLinks });
	};

	private deleteReduxState = (): void => {
		store.dispatch(deletePageState());
	};

	private updateBreadCrumbs = (breadCrumbs: BreadCrumb[]): void => {
		this.setState({ breadCrumbs });
	};

	private authorizeUser = (member: SigninReturn): void => {
		let fullMember = this.state.state === 'LOADED' ? this.state.fullMember : null;

		if (member.error === MemberCreateError.NONE && fullMember) {
			if (member.member.id !== fullMember.id) {
				fullMember = member.member;
			}
		} else if (member.error === MemberCreateError.NONE) {
			fullMember = member.member;
		} else {
			fullMember = null;
		}

		this.setState(prev =>
			prev.state === 'LOADED'
				? {
						...prev,
						member,
						fullMember,
				  }
				: prev,
		);
	};

	private update = (): void => {
		this.forceUpdate();
	};

	private updateTeamList = async (): Promise<void> => {
		if (this.currentTeamsListRequestInProgress) {
			return;
		}

		this.currentTeamsListRequestInProgress = true;

		const result = await fetchApi.team.list({}, {});

		this.setState(
			{
				teamList: result,
			},
			() => {
				this.currentTeamsListRequestInProgress = false;
			},
		);
	};

	private updateMemberList = async (): Promise<void> => {
		if (this.currentMembersListRequestInProgress) {
			return;
		}

		this.currentMembersListRequestInProgress = true;

		const result = await fetchApi.member.memberList({}, {});

		this.setState(
			{
				memberList: result,
			},
			() => {
				this.currentMembersListRequestInProgress = false;
			},
		);
	};
}
