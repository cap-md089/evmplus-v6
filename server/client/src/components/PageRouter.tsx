import * as React from 'react';
import { Route } from 'react-router-dom';

import Main from '../pages/Main';
import Test from '../pages/Test';
import Blog from '../pages/Blog';
import RackBuilder from '../pages/RibbonRack';

const pages = [
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
		url: '/rack',
		component: RackBuilder,
		exact: false
	}
];

export default class PageRouter extends React.Component {
	constructor(props: {}) {
		super(props);
	}

	render () {
		return (
			<div id="pageblock">
				{
					pages.map((value, i) => {
						return (
							<Route
								key={i}
								path={value.url}
								exact={value.exact}
								component={value.component as any}
							/>
						);
					})
				}
			</div>
		);
	}
}