/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	always,
	Either,
	MemberCreateError,
	RegistryValues,
	SigninReturn,
	User
} from 'common-lib';
import * as React from 'react';
import { Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';
import fetchApi from '../lib/apis';
import FinishPasswordResetForm from '../pages/account/FinishPasswordReset';
import FinishSignup from '../pages/account/FinishSignup';
import RegisterDiscord from '../pages/account/RegisterDiscord';
import RequestPasswordResetForm from '../pages/account/RequestPasswordReset';
import RequestUsernameForm from '../pages/account/RequestUsername';
import Signin from '../pages/account/Signin';
import Signup from '../pages/account/Signup';
import Admin from '../pages/admin/Admin';
import FlightAssign from '../pages/admin/pages/FlightAssign';
import Notifications from '../pages/admin/pages/Notifications';
import RegEdit from '../pages/admin/pages/RegEdit';
import Calendar from '../pages/Calendar';
import Debug from '../pages/Debug';
import Drive from '../pages/Drive';
import LinkList from '../pages/EventLinkList';
import AddEvent from '../pages/events/AddEvent';
import AttendanceMultiAdd from '../pages/events/AttendanceMultiAdd';
import EventViewer from '../pages/events/EventViewer';
import ModifyEvent from '../pages/events/ModifyEvent';
import Main from '../pages/Main';
import NotFound from '../pages/NotFound';
import Page from '../pages/Page';
import TeamAdd from '../pages/team/TeamAdd';
import TeamEdit from '../pages/team/TeamEdit';
import TeamList from '../pages/team/TeamList';
import TeamView from '../pages/team/TeamView';
import { BreadCrumb } from './BreadCrumbs';
import ErrorHandler from './ErrorHandler';
import Loader from './Loader';
import { SideNavigationItem } from './page-elements/SideNavigation';

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
		url: '/team/edit/:id',
		component: TeamEdit,
		exact: false
	},
	{
		url: '/team/:id',
		component: TeamView,
		exact: false
	},
	{
		url: '/admin',
		component: Admin,
		exact: false
	},
	{
		url: '/regedit',
		component: RegEdit,
		exact: false
	},
	{
		url: '/flightassign',
		component: FlightAssign,
		exact: false
	},
	{
		url: '/notifications',
		component: Notifications,
		exact: false
	},
	{
		url: '/debug',
		component: Debug,
		exact: true
	},
	{
		url: '/signin',
		component: Signin,
		exact: false
	},
	{
		url: '/finishaccount/:token',
		component: FinishSignup,
		exact: true
	},
	{
		url: '/create-account',
		component: Signup,
		exact: true
	},
	{
		url: '/passwordreset',
		component: RequestPasswordResetForm,
		exact: true
	},
	{
		url: '/usernamerequest',
		component: RequestUsernameForm,
		exact: true
	},
	{
		url: '/finishpasswordreset/:token',
		component: FinishPasswordResetForm,
		exact: true
	},
	{
		url: '/registerdiscord/:discordid',
		component: RegisterDiscord,
		exact: true
	},

	// THIS GOES LAST
	// Otherwise, have fun debugging why you get a 404 for every page
	{
		url: '/',
		component: NotFound,
		exact: false
	}
];

const composeElement = (
	El: typeof Page,
	account: AccountObject,
	authorizeUser: (arg: SigninReturn) => void,
	updateSideNav: (links: SideNavigationItem[]) => void,
	updateBreadcrumbs: (links: BreadCrumb[]) => void,
	registry: RegistryValues,
	member: User | null,
	fullMemberDetails: SigninReturn,
	updateApp: () => void
) => (props: RouteComponentProps<any>) => {
	return (
		<PageDisplayer
			updateApp={updateApp}
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
	account: AccountObject;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	registry: RegistryValues;
	member: User | null;
	fullMemberDetails: SigninReturn;
	routeProps: RouteComponentProps<any>;
	updateApp: () => void;
}

class PageDisplayer extends React.Component<PageDisplayerProps> {
	private okURL = '';

	public constructor(props: PageDisplayerProps) {
		super(props);

		this.prepareURL = this.prepareURL.bind(this);
	}

	public shouldComponentUpdate(nextProps: PageDisplayerProps) {
		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const urlChanged =
			nextProps.routeProps.location.pathname !== this.okURL &&
			nextProps.routeProps.location.pathname !== this.props.routeProps.location.pathname;

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
			urlChanged ||
			nextProps.routeProps.location.hash !== this.props.routeProps.location.hash;

		return shouldUpdate;
	}

	public render() {
		// tslint:disable-next-line:no-console
		console.log('Rendering component');
		return (
			<ErrorHandler member={this.props.member} account={this.props.account}>
				<this.props.El
					updateApp={this.props.updateApp}
					fullMemberDetails={this.props.fullMemberDetails}
					routeProps={this.props.routeProps}
					account={this.props.account}
					member={this.props.member}
					authorizeUser={this.props.authorizeUser}
					updateSideNav={this.props.updateSideNav}
					updateBreadCrumbs={this.props.updateBreadCrumbs}
					key="mainpage"
					registry={this.props.registry}
					prepareURL={this.prepareURL}
				/>
			</ErrorHandler>
		);
	}

	private prepareURL(url: string) {
		this.okURL = url;
	}
}

interface PageRouterProps extends RouteComponentProps<any> {
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	member: User | null;
	account: AccountObject;
	authorizeUser: (arg: SigninReturn) => void;
	registry: RegistryValues;
	fullMemberDetails: SigninReturn;
	updateApp: () => void;
}

interface PageRouterState {
	loading: boolean;
	previousPath: string;
	previousHash: string;
}

class PageRouter extends React.Component<PageRouterProps, PageRouterState> {
	constructor(props: PageRouterProps) {
		super(props);

		this.state = {
			loading: false,
			previousHash: props.location.hash,
			previousPath: ''
		};
	}

	public shouldComponentUpdate(nextProps: PageRouterProps, nextState: PageRouterState) {
		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
			nextProps.location.pathname !== this.props.location.pathname ||
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
			currentSID !== '' &&
			currentSID !== null &&
			this.state.loading === false &&
			(this.props.location.hash !== this.state.previousHash ||
				this.props.location.pathname !== this.state.previousPath)
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
				fetchApi
					.check({}, {}, member.sessionID)
					.leftFlatMap(always(Either.right({ error: MemberCreateError.SERVER_ERROR })))
					.fullJoin()
					.then(ret => {
						this.props.authorizeUser(ret);

						this.setState({
							loading: false
						});
					});
			}
		}
	}

	public render() {
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const loading =
			this.state.loading ||
			(currentSID !== '' &&
				currentSID !== null &&
				this.state.loading === false &&
				(this.props.location.hash !== this.state.previousHash ||
					(this.props.location.pathname !== this.state.previousPath &&
						this.state.previousPath !== '')));

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
				<Switch>
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
									this.props.fullMemberDetails,
									this.props.updateApp
								)}
							/>
						);
					})}
				</Switch>
			</div>
		);
	}
}

export default withRouter(PageRouter);
