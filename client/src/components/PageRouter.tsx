import * as React from 'react';
import { Route, RouteComponentProps, withRouter } from 'react-router-dom';
import Registry from 'src/lib/Registry';
import { BlogEdit } from 'src/pages/blog/BlogEdit';
import { BlogList } from 'src/pages/blog/BlogList';
import { BlogPostCreate } from 'src/pages/blog/BlogPostCreate';
import { BlogView } from 'src/pages/blog/BlogView';
import PageCreate from 'src/pages/pages/PageCreate';
import PageEdit from 'src/pages/pages/PageEdit';
import PageList from 'src/pages/pages/PageList';
import PageView from 'src/pages/pages/PageView';
import Account from '../lib/Account';
import MemberBase from '../lib/Members';
import AddEvent from '../pages/events/AddEvent';
import Calendar from '../pages/Calendar';
import Drive from '../pages/Drive';
import EmailList from '../pages/EmailList';
import LinkList from '../pages/EventLinkList';
import EventViewer from '../pages/events/EventViewer';
import Main from '../pages/Main';
import ModifyEvent from '../pages/events/ModifyEvent';
import Page from '../pages/Page';
import RackBuilder from '../pages/RibbonRack';
import Test from '../pages/Test';
import { BreadCrumb } from './BreadCrumbs';
import ErrorHandler from './ErrorHandler';
import Loader from './Loader';
import { SideNavigationItem } from './SideNavigation';
import AttendanceMultiAdd from 'src/pages/events/AttendanceMultiAdd';
import TeamAdd from 'src/pages/team/TeamAdd';
import TeamList from 'src/pages/team/TeamList';
import TeamView from 'src/pages/team/TeamView';

const pages: Array<{
	url: string;
	component: typeof Page;
	exact: boolean;
}> = [
	{
		url: '/',
		component: Main,
		exact: true
	},
	{
		url: '/test',
		component: Test,
		exact: false
	},
	{
		url: '/blog',
		component: BlogList,
		exact: true
	},
	{
		url: '/blog/page/:id',
		component: BlogList,
		exact: false
	},
	{
		url: '/blog/view/:id',
		component: BlogView,
		exact: false
	},
	{
		url: '/blog/post',
		component: BlogPostCreate,
		exact: false
	},
	{
		url: '/blog/edit/:id',
		component: BlogEdit,
		exact: false
	},
	{
		url: '/news',
		component: BlogList,
		exact: true
	},
	{
		url: '/news/page/:id',
		component: BlogList,
		exact: false
	},
	{
		url: '/news/view/:id',
		component: BlogView,
		exact: false
	},
	{
		url: '/news/post',
		component: BlogPostCreate,
		exact: false
	},
	{
		url: '/news/edit/:id',
		component: BlogEdit,
		exact: false
	},
	{
		url: '/rack',
		component: RackBuilder,
		exact: false
	},
	{
		url: '/eventform',
		component: AddEvent,
		exact: true
	},
	{
		url: '/addevent',
		component: AddEvent,
		exact: true
	},
	{
		url: '/eventviewer/:id',
		component: EventViewer,
		exact: false
	},
	{
		url: '/eventlinklist',
		component: LinkList,
		exact: false
	},
	{
		url: '/eventform/:id',
		component: ModifyEvent,
		exact: false
	},
	{
		url: '/modifyevent/:id',
		component: ModifyEvent,
		exact: false
	},
	{
		url: '/calendar/:month?/:year?',
		component: Calendar,
		exact: false
	},
	{
		url: '/emailselector',
		component: EmailList,
		exact: false
	},
	{
		url: '/filemanagement',
		component: Drive,
		exact: false
	},
	{
		url: '/drive',
		component: Drive,
		exact: false
	},
	{
		url: '/page/view/:id',
		component: PageView,
		exact: false
	},
	{
		url: '/page/edit/:id',
		component: PageEdit,
		exact: false
	},
	{
		url: '/page/create',
		component: PageCreate,
		exact: false
	},
	{
		url: '/page/list',
		component: PageList,
		exact: false
	},
	{
		url: '/multiadd/:id',
		component: AttendanceMultiAdd,
		exact: false
	},
	{
		url: '/team/create',
		component: TeamAdd,
		exact: false
	},
	{
		url: '/team',
		component: TeamList,
		exact: true
	},
	{
		url: '/teamlist',
		component: TeamList,
		exact: false
	},
	{
		url: '/team/list',
		component: TeamList,
		exact: false
	},
	{
		url: '/teamview/:id',
		component: TeamView,
		exact: false
	},
	{
		url: '/team/view/:id',
		component: TeamView,
		exact: false
	},
	{
		url: '/team/:id',
		component: TeamView,
		exact: false
	}
];

const composeElement = (
	El: typeof Page,
	account: Account,
	authorizeUser: (arg: SigninReturn) => void,
	updateSideNav: (links: SideNavigationItem[]) => void,
	updateBreadcrumbs: (links: BreadCrumb[]) => void,
	registry: Registry,
	member: MemberBase | null,
	fullMemberDetails: SigninReturn
) => (props: RouteComponentProps<any>) => {
	return (
		<PageDisplayer
			El={El}
			account={account}
			authorizeUser={authorizeUser}
			updateSideNav={updateSideNav}
			updateBreadCrumbs={updateBreadcrumbs}
			registry={registry}
			member={member}
			fullMemberDetails={fullMemberDetails}
			routeProps={props}
		/>
	);
};

interface PageDisplayerProps {
	El: typeof Page;
	account: Account;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	registry: Registry;
	member: MemberBase | null;
	fullMemberDetails: SigninReturn;
	routeProps: RouteComponentProps<any>;
}

class PageDisplayer extends React.Component<PageDisplayerProps> {
	public shouldComponentUpdate(nextProps: PageDisplayerProps) {
		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
			nextProps.routeProps.location.pathname !==
				this.props.routeProps.location.pathname ||
			nextProps.routeProps.location.hash !==
				this.props.routeProps.location.hash;

		return shouldUpdate;
	}

	public render() {
		// tslint:disable-next-line:no-console
		console.log('Rendering component');
		return (
			<ErrorHandler
				member={this.props.member}
				account={this.props.account}
			>
				<this.props.El
					fullMemberDetails={this.props.fullMemberDetails}
					routeProps={this.props.routeProps}
					account={this.props.account}
					member={this.props.member}
					authorizeUser={this.props.authorizeUser}
					updateSideNav={this.props.updateSideNav}
					updateBreadCrumbs={this.props.updateBreadCrumbs}
					key="mainpage"
					registry={this.props.registry}
				/>
			</ErrorHandler>
		);
	}
}

interface PageRouterProps extends RouteComponentProps<any> {
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	member: MemberBase | null;
	account: Account;
	authorizeUser: (arg: SigninReturn) => void;
	registry: Registry;
	fullMemberDetails: SigninReturn;
}

interface PageRouterState {
	loading: boolean;
	previousPath: string;
	previousHash: string;
}

class PageRouter extends React.Component<PageRouterProps, PageRouterState> {
	public state = {
		loading: false,
		previousHash: '',
		previousPath: '',
	};

	constructor(props: PageRouterProps) {
		super(props);

		if (props.member) {
			this.state = {
				loading: false,
				previousHash: '',
				previousPath: '',
			}
		}
	}

	public shouldComponentUpdate(
		nextProps: PageRouterProps,
		nextState: PageRouterState
	) {
		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
			nextProps.location.pathname !== this.props.location.pathname ||
			nextProps.location.hash !== this.props.location.hash ||
			(nextState.loading === false && this.state.loading === true);

		return shouldUpdate;
	}

	public componentDidUpdate() {
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		// Need to keep track of the previous path and hash ourselves,
		// so that it doesn't get stuck in a loop of infinite updates
		// It's only supposed to run if the page changes and the component
		// hasn't finished updating the session ID
		if (
			(currentSID !== '' &&
			currentSID !== null &&
			this.state.loading === false &&
			(this.props.location.hash !== this.state.previousHash ||
				this.props.location.pathname !== this.state.previousPath))
		) {
			// tslint:disable-next-line:no-console
			console.log('Refreshing session ID');

			this.setState({
				loading: true,
				previousHash: this.props.location.hash,
				previousPath: this.props.location.pathname
			});

			const { member } = this.props;

			if (member) {
				member
					.fetch(`/api/check`, {}, member)
					.then(res => res.json())
					.then((sr: SigninReturn) => {
						this.props.authorizeUser(sr);

						this.setState({
							loading: false,
						});
					});
			}
		}
	}

	public render() {
		const loading = this.state.loading;

		if (!loading) {
			// tslint:disable-next-line:no-console
			console.log('');
			// tslint:disable-next-line:no-console
			console.log('Rendering page');
		}

		return loading ? (
			<Loader />
		) : (
			<div id="pageblock">
				{/*<Switch>*/}
					{pages.map((value, i) => {
						return (
							<Route
								key={i}
								path={value.url}
								exact={value.exact}
								component={composeElement(
									value.component,
									this.props.account,
									this.props.authorizeUser,
									this.props.updateSideNav,
									this.props.updateBreadCrumbs,
									this.props.registry,
									this.props.member,
									this.props.fullMemberDetails
								)}
							/>
						);
					})}
				{/*</Switch>*/}
			</div>
		);
	}
}

export default withRouter(PageRouter);
