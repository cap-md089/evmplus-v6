import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import AddEvent from '../pages/AddEvent';
import Blog from '../pages/Blog';
import Main from '../pages/Main';
import Page from '../pages/Page';
import RackBuilder from '../pages/RibbonRack';
import Test from '../pages/Test';
import { BreadCrumb } from './BreadCrumbs';

const pages: Array<{
	url: string,
	component: typeof Page,
	exact: boolean
}> = [
	{
		url: '/',
		component: Main as typeof Page,
		exact: true
	},
	{
		url: '/test',
		component: Test as typeof Page,
		exact: false
	},
	{
		url: '/blog',
		component: Blog as typeof Page,
		exact: false
	},
	{
		url: '/rack',
		component: RackBuilder as typeof Page,
		exact: false
	},
	{
		url: '/eventform',
		component: AddEvent as typeof Page,
		exact: false
	}
];

const composeElement = (
	El: typeof Page,
	member: SigninReturn,
	authorizeUser: (arg: SigninReturn) => void
) => (props: RouteComponentProps<any>) => (
	<El routeProps={props} member={member} authorizeUser={authorizeUser} />
);

export default class PageRouter extends React.Component<{
	updateSideNav: (links: JSX.Element[]) => void;
	updateBreadcrumbs: (links: BreadCrumb[]) => void;
	member: SigninReturn;
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
							component={composeElement(value.component, this.props.member, this.props.authorizeUser)}
						/>
					);
				})}
			</div>
		);
	}
}
