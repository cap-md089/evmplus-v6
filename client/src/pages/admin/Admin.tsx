import * as React from 'react';
import { Route, Switch } from 'react-router';
import MemberBase from 'src/lib/Members';
import Page, { PageProps } from '../Page';
import './Admin.css';
import { AbsenteeWidget, canUseAbsentee } from './pluggables/Absentee';
import { canUseCreate, CreateWidget } from './pluggables/Create';
import { DriveWidget } from './pluggables/Drive';
import FlightContact, {
	FlightContactWidget,
	shouldRenderFlightContactWidget
} from './pluggables/FlightContact';
import { shouldRenderSiteAdmin, SiteAdminWidget } from './pluggables/SiteAdmin';
import './Widget.css';
import RegEdit from './pages/RegEdit';
import FlightAssign from './pages/FlightAssign';

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
		canuse: shouldRenderFlightContactWidget,
		widget: FlightContactWidget
	},
	{
		canuse,
		widget: DriveWidget
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
		canuse: shouldRenderSiteAdmin,
		widget: SiteAdminWidget
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
		if (!(
			document.location.pathname === '/admin/regedit' ||
			document.location.pathname === '/admin/flightcontact' ||
			document.location.pathname === '/admin/flightassign' ||
			document.location.pathname === '/admin/permissions'
		)) {
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

				{/* <Route path="/permmgmt" render={this.pageRenderer()} />*/}
				{/* <Route path="/admin/permissions" render={this.pageRenderer()} /> */}

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
