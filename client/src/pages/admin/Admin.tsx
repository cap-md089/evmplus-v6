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

import { hasPermission, isRioux } from 'common-lib';
import * as React from 'react';
import { Route, Switch } from 'react-router';
import SigninLink from '../../components/SigninLink';
import Page, { PageProps } from '../Page';
import './Admin.css';
import AttendanceHistory from './pages/AttendanceHistory';
import EmailList from './pages/EmailList';
import ErrorListPage, { ErrorListWidget, shouldRenderErrorList } from './pages/ErrorList';
import FlightAssign from './pages/FlightAssign';
import Notifications from './pages/Notifications';
import PermissionAssign from './pages/PermissionAssign';
import CreateAccount from '../events/CreateAccount';
import RegEdit from './pages/RegEdit';
import TemporaryDutyPositions from './pages/TemporaryDutyPosition';
import { AbsenteeWidget, canUseAbsentee } from './pluggables/Absentee';
import { canUseCreate, CreateWidget } from './pluggables/Create';
import { DriveWidget } from './pluggables/Drive';
import FlightContact, {
	FlightContactWidget,
	shouldRenderFlightContactWidget
} from './pluggables/FlightContact';
import NotificationsPlug, { shouldRenderNotifications } from './pluggables/Notifications';
import { shouldRenderSiteAdmin, SiteAdminWidget } from './pluggables/SiteAdmin';
import SuWidget, { canUseSu } from './pluggables/Su';
import './Widget.css';

interface UnloadedAdminState {
	loaded: false;
	absneteeInformation: null;
}

interface LoadedAdminState {
	loaded: true;
	absenteeInformation: null | {
		until: number;
		description: string;
	};
}

type AdminState = LoadedAdminState | UnloadedAdminState;

const canuse = () => true;

const widgets: Array<{ canuse: (props: PageProps) => boolean; widget: typeof Page }> = [
	{
		canuse: shouldRenderNotifications,
		widget: NotificationsPlug
	},
	{
		canuse: ({ member }) => !!member && hasPermission('FileManagement')()(member),
		widget: DriveWidget
	},
	{
		canuse: shouldRenderSiteAdmin,
		widget: SiteAdminWidget
	},
	{
		canuse: canUseCreate,
		widget: CreateWidget
	},
	{
		canuse: canUseAbsentee,
		widget: AbsenteeWidget
	},
	{
		canuse: shouldRenderFlightContactWidget,
		widget: FlightContactWidget
	},
	{
		canuse: canUseSu,
		widget: SuWidget
	},
	{
		canuse: shouldRenderErrorList,
		widget: ErrorListWidget
	}
];

export default class Admin extends Page<PageProps, AdminState> {
	public state: AdminState = {
		loaded: false,
		absneteeInformation: null
	};

	constructor(props: PageProps) {
		super(props);

		this.defaultPage = this.defaultPage.bind(this);
	}

	public componentDidMount() {
		if (!document.location.pathname.match(/\/admin\/.*/)) {
			this.props.updateSideNav([]);
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/admin',
					text: 'Administration'
				}
			]);
			this.updateTitle('Administration');
		}
	}

	public render() {
		if (!this.props.member) {
			return <SigninLink>Please sign in</SigninLink>;
		}

		return (
			<Switch>
				<Route path="/admin/regedit" render={this.pageRenderer(RegEdit)} exact={false} />
				<Route
					path="/admin/flightassign"
					render={this.pageRenderer(FlightAssign)}
					exact={false}
				/>
				<Route
					path="/admin/notifications"
					render={this.pageRenderer(Notifications)}
					exact={false}
				/>
				<Route
					path="/admin/permissions"
					render={this.pageRenderer(PermissionAssign)}
					exact={false}
				/>
				<Route
					path="/admin/flightcontact"
					render={this.pageRenderer(FlightContact)}
					exact={false}
				/>
				<Route
					path="/admin/squadroncontact"
					render={this.pageRenderer(FlightContact)}
					exact={false}
				/>
				<Route
					path="/admin/tempdutypositions"
					render={this.pageRenderer(TemporaryDutyPositions)}
					exact={false}
				/>
				<Route
					path="/admin/emaillist"
					render={this.pageRenderer(EmailList)}
					exact={false}
				/>
				<Route
					path="/admin/errorlist"
					render={this.pageRenderer(ErrorListPage)}
					exact={false}
				/>
				<Route
					path="/admin/attendance/"
					render={this.pageRenderer(AttendanceHistory)}
					exact={false}
				/>
				<Route
					path="/admin/createeventaccount/"
					render={this.pageRenderer(CreateAccount)}
					exact={false}
				/>

				<Route path="/admin" exact={false} render={this.defaultPage} />
			</Switch>
		);
	}

	private defaultPage() {
		const member = this.props.member;

		if (!member) {
			return <SigninLink>Please sign in</SigninLink>;
		}

		return (
			<div className="widget-holder">
				{widgets.map((val, i) =>
					val.canuse(this.props) || isRioux(member) ? (
						<val.widget {...this.props} key={i} />
					) : null
				)}
			</div>
		);
	}

	private pageRenderer(Component: typeof Page) {
		return () => <Component {...this.props} />;
	}
}
