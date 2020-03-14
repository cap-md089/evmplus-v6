import { FileObject, fromValue, MemberCreateError, SigninReturn } from 'common-lib';
import * as React from 'react';
import './App.scss';
import BreadCrumbs, { BreadCrumb } from './components/BreadCrumbs';
import GlobalNotification from './components/GlobalNotification';
import Loader from './components/Loader';
import Footer from './components/page-elements/Footer';
import Header from './components/page-elements/Header';
import SideNavigation, { SideNavigationItem } from './components/page-elements/SideNavigation';
import PageRouter from './components/PageRouter';
import Account from './lib/Account';
import { CAPMemberClasses, createCorrectMemberObject, getMember } from './lib/Members';
import myFetch from './lib/myFetch';
import Registry from './lib/Registry';

interface AppState {
	Registry: Registry | null;
	member: SigninReturn;
	fullMember: CAPMemberClasses | null;
	loading: boolean;
	account: Account | null;
	sideNavLinks: SideNavigationItem[];
	breadCrumbs: BreadCrumb[];
	allowedSlideshowIDs: FileObject[];
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
			error: MemberCreateError.INVALID_SESSION_ID
		},
		loading: true,
		account: null,
		Registry: null,
		sideNavLinks: [],
		breadCrumbs: [],
		allowedSlideshowIDs: [],
		fullMember: null
	};

	private timer: NodeJS.Timer | null = null;

	constructor(props: { isMobile: boolean }) {
		super(props);

		this.authorizeUser = this.authorizeUser.bind(this);
		this.updateBreadCrumbs = this.updateBreadCrumbs.bind(this);
		this.updateSideNav = this.updateSideNav.bind(this);
		this.onStorageChange = this.onStorageChange.bind(this);
		this.update = this.update.bind(this);
	}

	public async componentDidMount() {
		myFetch('/api/banner')
			.then(res => res.json())
			.then((allowedSlideshowIDs: FileObject[]) => {
				this.setState({ allowedSlideshowIDs });
			});

		const sessionID = localStorage.getItem('sessionID');

		this.setState({
			loading: true
		});

		window.addEventListener('storage', this.onStorageChange);

		const [account, member] = await Promise.all([Account.Get(), getMember(sessionID || '')]);

		if (member.error !== MemberCreateError.NONE) {
			localStorage.removeItem('sessionID');
		}

		const fullMember =
			member.error !== MemberCreateError.NONE
				? null
				: createCorrectMemberObject(member.member, account, member.sessionID);

		const registry = await Registry.Get(account);

		this.setState({
			Registry: registry,
			account,
			member,
			loading: false,
			fullMember
		});
	}

	public componentWillUnmount() {
		if (this.timer) {
			clearInterval(this.timer);
		}

		window.removeEventListener('storage', this.onStorageChange);
	}

	public render() {
		return (
			<>
				<Header registry={fromValue(this.state.Registry)} />
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
				<Footer registry={fromValue(this.state.Registry)} />
			</>
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
				fullMember = createCorrectMemberObject(
					member.member,
					this.state.account!,
					member.sessionID
				);
			} else {
				fullMember.sessionID = member.sessionID;
			}
		} else if (member.error === MemberCreateError.NONE) {
			fullMember = createCorrectMemberObject(
				member.member,
				this.state.account!,
				member.sessionID
			);
		} else {
			fullMember = null;
		}

		this.setState({
			member,
			fullMember
		});
		if (member.error === MemberCreateError.NONE) {
			localStorage.setItem('sessionID', member.sessionID);
		} else {
			localStorage.removeItem('sessionID');
		}
	}

	private onStorageChange(e: StorageEvent) {
		if (e.key === 'sessionID' && e.newValue !== '') {
			this.setState({
				loading: true
			});
			getMember(e.newValue || '')
				.then(member => {
					if (member.error !== MemberCreateError.NONE) {
						localStorage.removeItem('sessionID');
					}
					this.setState({ member, loading: false });
				})
				.catch(() => {
					this.setState({
						member: {
							error: MemberCreateError.INVALID_SESSION_ID
						},
						loading: false
					});
				});
		} else if (e.key === 'sessionID') {
			this.setState({
				member: {
					error: MemberCreateError.INVALID_SESSION_ID
				}
			});
		}
	}

	private update() {
		this.forceUpdate();
	}
}
