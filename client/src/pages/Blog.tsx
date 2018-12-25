import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import './blog.css';
import Page, { PageProps } from './Page';

import { BlogList } from './blog/BlogList';
import { BlogPostCreate } from './blog/BlogPostCreate';
import { BlogEdit } from './blog/BlogEdit';
import { BlogView } from './blog/BlogView';

export type DraftJS = typeof import('draft-js');

export default class Blog extends Page<PageProps<{ id: string }>> {
	public render() {
		return (
			<>
				<Route
					exact={true}
					path="/blog"
					component={(
						props: RouteComponentProps<{ page: string }>
					) => <BlogList {...this.props} routeProps={props} />}
				/>
				<Route
					path="/blog/page/:page"
					component={(
						props: RouteComponentProps<{ page: string }>
					) => <BlogList {...this.props} routeProps={props} />}
				/>
				<Route
					path="/blog/post"
					component={() => <BlogPostCreate {...this.props} />}
				/>
				<Route
					path="/blog/view/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<BlogView {...this.props} routeProps={props} />
					)}
				/>
				<Route
					path="/blog/edit/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<BlogEdit {...this.props} routeProps={props} />
					)}
				/>
				<Route
					exact={true}
					path="/news"
					component={(
						props: RouteComponentProps<{ page: string }>
					) => <BlogList {...this.props} routeProps={props} />}
				/>
				<Route
					path="/news/page/:page"
					component={(
						props: RouteComponentProps<{ page: string }>
					) => <BlogList {...this.props} routeProps={props} />}
				/>
				<Route
					path="/news/post"
					component={() => <BlogPostCreate {...this.props} />}
				/>
				<Route
					path="/news/view/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<BlogView {...this.props} routeProps={props} />
					)}
				/>
				<Route
					path="/news/edit/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<BlogEdit {...this.props} routeProps={props} />
					)}
				/>
			</>
		);
	}
}
