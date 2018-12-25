import * as React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import BlogPage from 'src/lib/BlogPage';
import Page from './Page';
import PageCreate from './pages/PageCreate';
import PageEdit from './pages/PageEdit';
import PageView from './pages/PageView';

type DraftJS = typeof import('draft-js');

interface UnloadedPageClass {
	page: null;
	loaded: false;
	draft: null;
	error: false;
}

interface LoadedPageClass {
	page: BlogPage;
	loaded: true;
	draft: DraftJS;
	error: false;
}

interface ErrorPageClass {
	page: null;
	loaded: true;
	draft: null;
	error: number;
}

export type PageState = UnloadedPageClass | LoadedPageClass | ErrorPageClass;

export default class Pages extends Page {
	public render() {
		return (
			<>
				<Route
					path="/page/view/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<PageView {...this.props} routeProps={props} />
					)}
				/>
				<Route
					path="/page/create"
					component={() => <PageCreate {...this.props} />}
				/>
				<Route
					path="/page/edit/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<PageEdit {...this.props} routeProps={props} />
					)}
				/>
			</>
		);
	}
}
