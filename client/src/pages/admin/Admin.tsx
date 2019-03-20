import * as React from 'react';
import { Route, Switch } from 'react-router';
import MemberBase from '../../lib/Members';
import Page, { PageProps } from '../Page';
import './Admin.css';
import FlightAssign from './pages/FlightAssign';
import Notifications from './pages/Notifications';
import PermissionAssign from './pages/PermissionAssign';
import RegEdit from './pages/RegEdit';
import { AbsenteeWidget, canUseAbsentee } from './pluggables/Absentee';
import { canUseCreate, CreateWidget } from './pluggables/Create';
import { DriveWidget } from './pluggables/Drive';
import FlightContact, {
	FlightContactWidget,
	shouldRenderFlightContactWidget
} from './pluggables/FlightContact';
import NotificationsPlug, { shouldRenderNotifications } from './pluggables/Notifications';
import { shouldRenderSiteAdmin, SiteAdminWidget } from './pluggables/SiteAdmin';
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
		canuse,
		widget: DriveWidget
	},
	{
		canuse: shouldRenderSiteAdmin,
		widget: SiteAdminWidget
	},
	{
		canuse: canUseAbsentee,
		widget: AbsenteeWidget
	},
	{
		canuse: canUseCreate,
		widget: CreateWidget
	},
	{
		canuse: shouldRenderNotifications,
		widget: NotificationsPlug
	},
	{
		canuse: shouldRenderFlightContactWidget,
		widget: FlightContactWidget
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
			return <div>Please sign in</div>;
		}

		return (
			<Switch>
				<Route path="/admin/regedit" render={this.pageRenderer(RegEdit)} />

				<Route path="/admin/flightassign" render={this.pageRenderer(FlightAssign)} />

				<Route path="/admin/notifications" render={this.pageRenderer(Notifications)} />

				{/* <Route path="/permmgmt" render={this.pageRenderer()} />*/}
				<Route path="/admin/permissions" render={this.pageRenderer(PermissionAssign)} />

				<Route path="/admin/flightcontact" render={this.pageRenderer(FlightContact)} />

				<Route path="/admin" exact={false} render={this.defaultPage} />
			</Switch>
		);
	}

	private defaultPage() {
		return (
			<div className="widget-holder">
				{widgets.map((val, i) =>
					val.canuse(this.props) || MemberBase.IsRioux(this.props.member) ? (
						<val.widget {...this.props} key={i} />
					) : null
				)}
			</div>
		);
	}

	private pageRenderer(Component: typeof Page) {
		return (() => <Component {...this.props} />).bind(this);
	}
}
