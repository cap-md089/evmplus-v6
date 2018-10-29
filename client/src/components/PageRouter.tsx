import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import Account from 'src/lib/Account';
import MemberBase from 'src/lib/Members';
import AddEvent from '../pages/AddEvent';
import Blog from '../pages/Blog';
import Calendar from '../pages/Calendar';
import Drive from '../pages/Drive';
import EmailList from '../pages/EmailList';
import LinkList from '../pages/EventLinkList';
import EventViewer from '../pages/EventViewer';
import Main from '../pages/Main';
import ModifyEvent from '../pages/ModifyEvent';
import Page from '../pages/Page';
import RackBuilder from '../pages/RibbonRack';
import Test from '../pages/Test';
import { BreadCrumb } from './BreadCrumbs';
import { SideNavigationItem } from './SideNavigation';

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
		component: Blog,
		exact: false
	},
	{
		url: '/news',
		component: Blog,
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
	}
];

const composeElement = (
	El: typeof Page,
	member: SigninReturn,
	account: Account,
	authorizeUser: (arg: SigninReturn) => void,
	updateSideNav: (links: SideNavigationItem[]) => void,
	updateBreadcrumbs: (links: BreadCrumb[]) => void
) => (props: RouteComponentProps<any>) => (
	<El
		routeProps={props}
		account={account}
		fullMemberDetails={member}
		member={
			member.member === null
				? null
				: MemberBase.CreateCorrectObject(
						member.member,
						account,
						member.sessionID
				  )
		}
		authorizeUser={authorizeUser}
		updateSideNav={updateSideNav}
		updateBreadCrumbs={updateBreadcrumbs}
	/>
);

export default class PageRouter extends React.PureComponent<{
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadcrumbs: (links: BreadCrumb[]) => void;
	member: SigninReturn;
	account: Account;
	authorizeUser: (arg: SigninReturn) => void;
}> {
	public render() {
		return (
			<div id="pageblock">
				{pages.map((value, i) => {
					return (
						<Route
							key={i}
							path={value.url}
							exact={value.exact}
							component={composeElement(
								value.component,
								this.props.member,
								this.props.account,
								this.props.authorizeUser,
								this.props.updateSideNav,
								this.props.updateBreadcrumbs
							)}
						/>
					);
				})}
			</div>
		);
	}
}
