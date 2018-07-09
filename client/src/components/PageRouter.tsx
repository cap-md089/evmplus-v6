import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import Blog from '../pages/Blog';
import Main from '../pages/Main';
import Page from '../pages/Page';
import RackBuilder from '../pages/RibbonRack';
import Test from '../pages/Test';
import { MemberObject } from '../types';
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
	}
];

const composeElement = (
	El: typeof Page,
	member: { value: MemberObject | null; valid: boolean; error: string }
) => (props: RouteComponentProps<any>) => (
	<El routeProps={props} member={member} />
);

export default class PageRouter extends React.Component<{
	updateSideNav: (links: JSX.Element[]) => void;
	updateBreadcrumbs: (links: BreadCrumb[]) => void;
	member: {
		value: MemberObject | null;
		valid: boolean;
		error: string;
	}
}> {
	constructor(props: {
		updateSideNav: (links: JSX.Element[]) => void;
		updateBreadcrumbs: (links: BreadCrumb[]) => void;
		member: {
			value: MemberObject | null;
			valid: boolean;
			error: string;
		}
	}) {
		super(props);
	}

	public render() {
		return (
			<div id="pageblock">
				{pages.map((value, i) => {
					return (
						<Route
							key={i}
							path={value.url}
							exact={value.exact}
							component={composeElement(value.component, this.props.member)}
						/>
					);
				})}
			</div>
		);
	}
}
