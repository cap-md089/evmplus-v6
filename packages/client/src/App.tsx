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
import './App.scss';
import BreadCrumbs, { BreadCrumb } from './components/BreadCrumbs';
import GlobalNotification from './components/GlobalNotification';
import Loader from './components/Loader';
import Footer from './components/page-elements/Footer';
import Header from './components/page-elements/Header';
import SideNavigation, { SideNavigationItem } from './components/page-elements/SideNavigation';
import PageRouter from './components/PageRouter';
import { MemberDetailsProvider, MemberListProvider, TeamListProvider } from './globals';
import fetchApi from './lib/apis';
import { getMember } from './lib/Members';

interface AppState {
	Registry: RegistryValues | null;
	member: SigninReturn;
	fullMember: ClientUser | null;
	loading: boolean;
	account: AccountObject | null;
	sideNavLinks: SideNavigationItem[];
	breadCrumbs: BreadCrumb[];
	allowedSlideshowIDs: FileObject[];
	loadError: boolean;
	memberList: EitherObj<HTTPError, Member[]> | null;
	teamList: EitherObj<HTTPError, FullTeamObject[]> | null;
}

export default class App extends React.Component<
	{
		isMobile: boolean;
	},
	AppState
> {
	public key: number | null = null;

	public state: AppState = {
		member: {
			error: MemberCreateError.INVALID_SESSION_ID,
		},
		loading: true,
		account: null,
		Registry: null,
		sideNavLinks: [],
		breadCrumbs: [],
		allowedSlideshowIDs: [],
		fullMember: null,
		loadError: false,
		memberList: null,
		teamList: null,
	};

	private timer: NodeJS.Timer | null = null;

	constructor(props: { isMobile: boolean }) {
		super(props);

		this.authorizeUser = this.authorizeUser.bind(this);
		this.updateBreadCrumbs = this.updateBreadCrumbs.bind(this);
		this.updateSideNav = this.updateSideNav.bind(this);
		this.update = this.update.bind(this);
		this.updateMemberList = this.updateMemberList.bind(this);
		this.updateTeamList = this.updateTeamList.bind(this);
	}

	public async componentDidMount() {
		fetchApi
			.slideshowImageIDs({}, {})
			.tap(allowedSlideshowIDs => this.setState({ allowedSlideshowIDs }));

		this.setState({
			loading: true,
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
				loadError: true,
				loading: false,
			});
			return;
		}

		const [account, registry, member] = infoEither.value;

		if (member.error !== MemberCreateError.NONE) {
			localStorage.removeItem('sessionID');
		}

		const fullMember = member.error !== MemberCreateError.NONE ? null : member.member;

		this.setState({
			Registry: registry,
			account,
			member,
			loading: false,
			fullMember,
		});
	}

	public componentWillUnmount() {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}

	public render() {
		return this.renderWithProviders(
			<>
				<Header
					loadingError={this.state.loadError}
					registry={Maybe.fromValue(this.state.Registry)}
				/>
				{/* <Slideshow fileIDs={this.state.allowedSlideshowIDs.map(item => item.id)} /> */}
				<div className="background">
					<div className="main-content-bottom" />
				</div>
				<SideNavigation
					links={this.state.sideNavLinks}
					member={this.state.fullMember}
					fullMemberDetails={this.state.member}
					authorizeUser={this.authorizeUser}
				/>
				<div className="content-border left-border" />
				<main>
					<div className="main-content">
						<div id="fb-root" />
						<BreadCrumbs links={this.state.breadCrumbs} />
						{this.state.loading ? null : (
							<GlobalNotification account={this.state.account!} />
						)}
						{this.state.loading ? (
							<Loader />
						) : this.state.loadError ? (
							<div>The account does not exist</div>
						) : (
							<PageRouter
								updateApp={this.update}
								updateSideNav={this.updateSideNav}
								updateBreadCrumbs={this.updateBreadCrumbs}
								member={this.state.fullMember}
								fullMemberDetails={this.state.member}
								account={this.state.account!}
								authorizeUser={this.authorizeUser}
								registry={this.state.Registry!}
								key="pagerouter"
							/>
						)}
					</div>
				</main>
				<div className="content-border right-border" />
				<Footer registry={Maybe.fromValue(this.state.Registry)} />
			</>,
		);
	}

	private renderWithProviders(el: JSX.Element): JSX.Element {
		return (
			<MemberDetailsProvider
				value={{
					member: this.state.fullMember,
					fullMember: this.state.member,
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
		);
	}

	private updateSideNav(sideNavLinks: SideNavigationItem[], force = false) {
		this.setState({ sideNavLinks });
	}

	private updateBreadCrumbs(breadCrumbs: BreadCrumb[]) {
		this.setState({ breadCrumbs });
	}

	private authorizeUser(member: SigninReturn) {
		let fullMember = this.state.fullMember;

		if (member.error === MemberCreateError.NONE && fullMember) {
			if (member.member.id !== fullMember.id) {
				fullMember = member.member;
			}
		} else if (member.error === MemberCreateError.NONE) {
			fullMember = member.member;
		} else {
			fullMember = null;
		}

		this.setState({
			member,
			fullMember,
		});
	}

	private update() {
		this.forceUpdate();
	}

	private currentTeamsListRequestInProgress: boolean = false;
	private async updateTeamList() {
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
	}

	private currentMembersListRequestInProgress: boolean = false;
	private async updateMemberList() {
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
	}
}
