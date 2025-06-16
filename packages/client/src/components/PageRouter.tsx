/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	always,
	ClientUser,
	Either,
	MemberCreateError,
	RegistryValues,
	SigninReturn,
} from 'common-lib';
import * as React from 'react';
import { Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';
import fetchApi from '../lib/apis';
import FinishPasswordResetForm from '../pages/account/FinishPasswordReset';
import FinishSignup from '../pages/account/FinishSignup';
import RegisterDiscord from '../pages/account/RegisterDiscord';
import RequestPasswordResetForm from '../pages/account/RequestPasswordReset';
import RequestUsernameForm from '../pages/account/RequestUsername';
import { SigninF } from '../pages/account/Signin';
import Signup from '../pages/account/Signup';
import Admin from '../pages/admin/Admin';
import FlightAssign from '../pages/admin/pages/FlightAssign';
// import Notifications from '../pages/admin/pages/Notifications';
import RegEdit from '../pages/admin/pages/RegEdit';
import Calendar from '../pages/Calendar';
import ChangeLog from '../pages/changelog/ChangeLog';
import Debug from '../pages/Debug';
import Drive from '../pages/drive/Drive';
import AddEvent from '../pages/events/AddEvent';
import AttendanceMultiAdd from '../pages/events/AttendanceMultiAdd';
import AuditViewer from '../pages/events/AuditViewer';
import LinkList from '../pages/events/EventLinkList';
import EventViewer from '../pages/events/EventViewer';
import ModifyEvent from '../pages/events/ModifyEvent';
import ScanAdd from '../pages/events/ScanAdd';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';
import TermsAndConditions from '../pages/legal/TermsAndConditions';
import Main from '../pages/Main';
import NotFound from '../pages/NotFound';
import Page, { PageProps } from '../pages/Page';
import { Quizzer } from '../pages/quizzer/Quizzer';
import TeamAdd from '../pages/team/TeamAdd';
import TeamEdit from '../pages/team/TeamEdit';
import TeamEmailList from '../pages/team/TeamEmail';
import TeamList from '../pages/team/TeamList';
import TeamView from '../pages/team/TeamView';
import { BreadCrumb } from './BreadCrumbs';
import ErrorHandler from './ErrorHandler';
import Loader from './Loader';
import { SideNavigationItem } from './page-elements/SideNavigation';

const pages: Array<{
	url: string;
	component: typeof Page | React.FC<PageProps<any>>;
	exact: boolean;
}> = [
		{
			url: '/',
			component: Main,
			exact: true,
		},
		{
			url: '/eventform',
			component: AddEvent,
			exact: true,
		},
		{
			url: '/addevent',
			component: AddEvent,
			exact: true,
		},
		{
			url: '/eventviewer/:id',
			component: EventViewer,
			exact: false,
		},
		{
			url: '/auditviewer/:id',
			component: AuditViewer,
			exact: false,
		},
		{
			url: '/eventlinklist',
			component: LinkList,
			exact: false,
		},
		{
			url: '/eventform/:id',
			component: ModifyEvent,
			exact: false,
		},
		{
			url: '/modifyevent/:id',
			component: ModifyEvent,
			exact: false,
		},
		{
			url: '/changelog',
			component: ChangeLog,
			exact: true,
		},
		{
			url: '/calendar/:month?/:year?',
			component: Calendar,
			exact: false,
		},
		{
			url: '/filemanagement/:id?',
			component: Drive,
			exact: false,
		},
		{
			url: '/drive/:id?',
			component: Drive,
			exact: false,
		},
		{
			url: '/multiadd/:id',
			component: AttendanceMultiAdd,
			exact: false,
		},
		{
			url: '/team/create',
			component: TeamAdd,
			exact: false,
		},
		{
			url: '/team',
			component: TeamList,
			exact: true,
		},
		{
			url: '/teamlist',
			component: TeamList,
			exact: false,
		},
		{
			url: '/team/list',
			component: TeamList,
			exact: false,
		},
		{
			url: '/teamview/:id',
			component: TeamView,
			exact: false,
		},
		{
			url: '/team/emails/:id',
			component: TeamEmailList,
			exact: false,
		},
		{
			url: '/team/view/:id',
			component: TeamView,
			exact: false,
		},
		{
			url: '/team/edit/:id',
			component: TeamEdit,
			exact: false,
		},
		{
			url: '/team/:id',
			component: TeamView,
			exact: false,
		},
		{
			url: '/admin',
			component: Admin,
			exact: false,
		},
		{
			url: '/regedit',
			component: RegEdit,
			exact: false,
		},
		{
			url: '/flightassign',
			component: FlightAssign,
			exact: false,
		},
		// {
		// 	url: '/notifications',
		// 	component: Notifications,
		// 	exact: false,
		// },
		{
			url: '/debug',
			component: Debug,
			exact: true,
		},
		{
			url: '/signin',
			component: SigninF,
			exact: false,
		},
		{
			url: '/finishaccount/:token',
			component: FinishSignup,
			exact: true,
		},
		{
			url: '/create-account',
			component: Signup,
			exact: true,
		},
		{
			url: '/passwordreset',
			component: RequestPasswordResetForm,
			exact: true,
		},
		{
			url: '/usernamerequest',
			component: RequestUsernameForm,
			exact: true,
		},
		{
			url: '/finishpasswordreset/:token',
			component: FinishPasswordResetForm,
			exact: true,
		},
		{
			url: '/registerdiscord/:discordid',
			component: RegisterDiscord,
			exact: true,
		},
		{
			url: '/capr393quizzer',
			component: Quizzer,
			exact: false,
		},
		{
			url: '/events/scanadd/:id',
			component: ScanAdd,
			exact: false,
		},
		{
			url: '/terms-and-conditions',
			component: TermsAndConditions,
			exact: false,
		},
		{
			url: '/privacy-policy',
			component: PrivacyPolicy,
			exact: false,
		},

		// THIS GOES LAST
		// Otherwise, have fun debugging why you get a 404 for every page
		{
			url: '/',
			component: NotFound,
			exact: false,
		},
	];

const composeElement =
	(props: {
		El: typeof Page | React.FC<PageProps>;
		account: AccountObject;
		authorizeUser: (arg: SigninReturn) => void;
		updateSideNav: (links: SideNavigationItem[]) => void;
		updateBreadCrumbs: (links: BreadCrumb[]) => void;
		registry: RegistryValues;
		member: ClientUser | null;
		fullMemberDetails: SigninReturn;
		updateApp: () => void;
		key: string;
		deleteReduxState: () => void;
	}) =>
		(routeProps: RouteComponentProps<any>) =>
		(
			<PageDisplayer
				key={props.key}
				updateApp={props.updateApp}
				El={props.El}
				account={props.account}
				authorizeUser={props.authorizeUser}
				updateSideNav={props.updateSideNav}
				updateBreadCrumbs={props.updateBreadCrumbs}
				registry={props.registry}
				member={props.member}
				fullMemberDetails={props.fullMemberDetails}
				routeProps={routeProps}
				deleteReduxState={props.deleteReduxState}
			/>
		);

interface PageDisplayerProps {
	El: typeof Page | React.FC<PageProps>;
	account: AccountObject;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	registry: RegistryValues;
	member: ClientUser | null;
	fullMemberDetails: SigninReturn;
	routeProps: RouteComponentProps<any>;
	updateApp: () => void;
	deleteReduxState: () => void;
}

class PageDisplayer extends React.Component<PageDisplayerProps> {
	private okURL = '';

	public constructor(props: PageDisplayerProps) {
		super(props);

		this.prepareURL = this.prepareURL.bind(this);
	}

	public shouldComponentUpdate(nextProps: PageDisplayerProps): boolean {
		const urlChanged =
			nextProps.routeProps.location.pathname !== this.okURL &&
			nextProps.routeProps.location.pathname !== this.props.routeProps.location.pathname;

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			urlChanged ||
			nextProps.routeProps.location.hash !== this.props.routeProps.location.hash;

		return shouldUpdate;
	}

	public render(): JSX.Element {
		// eslint-disable-next-line no-console
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
					deleteReduxState={this.props.deleteReduxState}
				/>
			</ErrorHandler>
		);
	}

	private prepareURL = (url: string): void => {
		this.okURL = url;
	};
}

interface PageRouterProps extends RouteComponentProps<any> {
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	member: ClientUser | null;
	account: AccountObject;
	authorizeUser: (arg: SigninReturn) => void;
	registry: RegistryValues;
	fullMemberDetails: SigninReturn;
	updateApp: () => void;
	deleteReduxState: () => void;
}

interface PageRouterState {
	loading: boolean;
	previousPath: string;
	previousHash: string;
}

class PageRouter extends React.Component<PageRouterProps, PageRouterState> {
	public state = {
		loading: false,
		previousHash: this.props.location.hash,
		previousPath: this.props.location.pathname,
	};

	private get shouldLoad(): boolean {
		// Need to keep track of the previous path and hash ourselves,
		// so that it doesn't get stuck in a loop of infinite updates
		// It's only supposed to run if the page changes and the component
		// hasn't finished updating the session ID
		return (
			this.props.member !== null &&
			this.state.loading === false &&
			(this.props.location.hash !== this.state.previousHash ||
				this.props.location.pathname !== this.state.previousPath)
		);
	}

	public shouldComponentUpdate(nextProps: PageRouterProps, nextState: PageRouterState): boolean {
		const nextID = nextProps.member?.id;
		const currentID = this.props.member?.id;

		const shouldUpdate =
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextID !== currentID ||
			nextProps.location.pathname !== this.props.location.pathname ||
			(nextState.loading === false && this.state.loading === true);

		return shouldUpdate;
	}

	public componentDidUpdate(): void {
		if (this.shouldLoad) {
			// eslint-disable-next-line no-console
			console.log('Refreshing session ID');

			this.setState({
				loading: true,
				previousHash: this.props.location.hash,
				previousPath: this.props.location.pathname,
			});

			void fetchApi
				.check({}, {})
				.leftFlatMap(
					always(
						Either.right({
							error: MemberCreateError.SERVER_ERROR as const,
						}),
					),
				)
				.fullJoin()
				.then(ret => {
					this.props.authorizeUser(ret);

					this.setState({
						loading: false,
					});
				});
		}
	}

	public render = (): JSX.Element =>
		this.state.loading || this.shouldLoad ? (
			<Loader />
		) : (
			<div id="pageblock">
				<Switch>
					{pages.map((value, i) => (
						<Route
							key={i}
							path={value.url}
							exact={value.exact}
							component={composeElement({
								El: value.component,
								account: this.props.account,
								authorizeUser: this.props.authorizeUser,
								updateSideNav: this.props.updateSideNav,
								updateBreadCrumbs: this.props.updateBreadCrumbs,
								registry: this.props.registry,
								member: this.props.member,
								fullMemberDetails: this.props.fullMemberDetails,
								updateApp: this.props.updateApp,
								key: value.url,
								deleteReduxState: this.props.deleteReduxState
							})}
						/>
					))}
				</Switch>
			</div>
		);
}

export default withRouter(PageRouter);
