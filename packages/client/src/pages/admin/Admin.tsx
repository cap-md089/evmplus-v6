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

import { AccountType, ClientUser, hasPermission, isRioux, Permissions } from 'common-lib';
import * as React from 'react';
import { Route, Switch } from 'react-router';
import SigninLink from '../../components/SigninLink';
import CreateProspectiveMember from '../account/CreateProspectiveMember';
import SetupMFA from '../account/SetupMFA';
import CreateAccount from '../events/CreateAccount';
import Page, { PageProps } from '../Page';
import './Admin.css';
import AttendanceHistory from './pages/AttendanceHistory';
import EmailList from './pages/EmailList';
import ErrorListPage, { ErrorListWidget, shouldRenderErrorList } from './pages/ErrorList';
import FlightAssign from './pages/FlightAssign';
// import Notifications from './pages/Notifications';
import PermissionAssign from './pages/PermissionAssign';
import ProspectiveMemberManagement from './pages/ProspectiveMemberManagement';
import RegEdit from './pages/RegEdit';
import TemporaryDutyPositions from './pages/TemporaryDutyPosition';
import { AbsenteeWidget, canUseAbsentee } from './pluggables/Absentee';
import { canUseCreate, CreateWidget } from './pluggables/Create';
import { DriveWidget } from './pluggables/Drive';
import FindMember, { shouldRenderMemberSearchWidget } from './pluggables/FindMember';
import FlightContact, {
	FlightContactWidget,
	shouldRenderFlightContactWidget,
} from './pluggables/FlightContact';
import { ProspectiveMemberManagementWidget } from './pluggables/ProspectiveMembers';
import { ReportsWidget, shouldRenderReports } from './pluggables/Reports';
import { shouldRenderSiteAdmin, SiteAdminWidget } from './pluggables/SiteAdmin';
import SuWidget, { canUseSu } from './pluggables/Su';
import './Widget.css';

interface UnloadedAdminState {
	loaded: false;
	absenteeInformation: null;
}

interface LoadedAdminState {
	loaded: true;
	absenteeInformation: null | {
		until: number;
		description: string;
	};
}

type AdminState = LoadedAdminState | UnloadedAdminState;

interface AdminWidgetProps extends PageProps<any> {
	member: ClientUser;
}

interface WidgetDefinition {
	canuse: (props: AdminWidgetProps) => boolean;
	widget: typeof Page | React.FC<AdminWidgetProps>;
}

const widgets: WidgetDefinition[] = [
	// {
	// 	canuse: shouldRenderNotifications,
	// 	widget: NotificationsPlug,
	// },
	{
		canuse: ({ member }) =>
			!!member && hasPermission('FileManagement')(Permissions.FileManagement.FULL)(member),
		widget: DriveWidget,
	},
	{
		canuse: shouldRenderSiteAdmin,
		widget: SiteAdminWidget,
	},
	{
		canuse: shouldRenderReports,
		widget: ReportsWidget,
	},
	{
		canuse: canUseCreate,
		widget: CreateWidget,
	},
	{
		canuse: canUseAbsentee,
		widget: AbsenteeWidget,
	},
	{
		canuse: shouldRenderFlightContactWidget,
		widget: FlightContactWidget,
	},
	{
		canuse: canUseSu,
		widget: SuWidget,
	},
	{
		canuse: shouldRenderErrorList,
		widget: ErrorListWidget,
	},
	{
		canuse: ({ member, account }) =>
			!!member &&
			hasPermission('ProspectiveMemberManagement')(
				Permissions.ProspectiveMemberManagement.FULL,
			)(member) &&
			account.type === AccountType.CAPSQUADRON,
		widget: ProspectiveMemberManagementWidget,
	},
	{
		canuse: shouldRenderMemberSearchWidget,
		widget: FindMember,
	},
];

export default class Admin extends Page<PageProps, AdminState> {
	public state: AdminState = {
		loaded: false,
		absenteeInformation: null,
	};

	public componentDidMount(): void {
		if (!/\/admin\/.*/.exec(document.location.pathname)) {
			this.props.updateSideNav([]);
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home',
				},
				{
					target: '/admin',
					text: 'Administration',
				},
			]);
			this.updateTitle('Administration');
		}
		this.props.deleteReduxState();
		
	}

	public render(): JSX.Element {
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
				{/* <Route
					path="/admin/notifications"
					render={this.pageRenderer(Notifications)}
					exact={false}
				/> */}
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
				<Route
					path="/admin/createcapprospectiveaccount"
					render={this.pageRenderer(CreateProspectiveMember)}
					exact={false}
				/>
				<Route
					path="/admin/prospectivemembermanagement"
					render={this.pageRenderer(ProspectiveMemberManagement)}
					exact={false}
				/>
				<Route path="/admin/setupmfa" render={this.pageRenderer(SetupMFA)} exact={false} />

				<Route path="/admin" exact={false} render={this.defaultPage} />
			</Switch>
		);
	}

	private defaultPage = (): JSX.Element => {
		const propsCheck = this.props;

		if (!propsCheck.member) {
			return <SigninLink>Please sign in</SigninLink>;
		}

		const props = propsCheck as AdminWidgetProps;

		return (
			<div className="widget-holder">
				{widgets.map((val, i) =>
					val.canuse(props) || isRioux(props.member) ? (
						<val.widget {...props} key={i} />
					) : null,
				)}
			</div>
		);
	};

	private pageRenderer = (Component: typeof Page) => () => (
		<Component key="/admin" {...this.props} />
	);
}
