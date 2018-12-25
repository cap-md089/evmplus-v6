import * as React from 'react';
import Page, { PageProps } from './Page';
import { Route, RouteComponentProps, Link } from 'react-router-dom';
import BlogPage from 'src/lib/BlogPage';
import Loader from 'src/components/Loader';
import TextDisplay from 'src/components/TextDisplay';

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

type PageState = UnloadedPageClass | LoadedPageClass | ErrorPageClass;

class PageView extends Page<PageProps<{ id: string }>, PageState> {
	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.state = {
			page: null,
			loaded: false,
			draft: null,
			error: false
		};
	}

	public async componentDidMount() {
		const id = this.props.routeProps.match.params.id;
		if (id) {
			try {
				const [page, draft] = await Promise.all([
					BlogPage.Get(id),
					import('draft-js')
				]);

				this.props.updateBreadCrumbs([
					
				]);
				this.props.updateSideNav([]);

				this.setState({
					page,
					draft,
					loaded: true
				});
			} catch (e) {
				this.setState({
					loaded: true,
					error: 404
				});
			}
		} else {
			this.setState({
				loaded: true,
				error: 404
			});
		}
	}

	public render() {
		if (!this.state.loaded) {
			return <Loader />;
		}

		if (this.state.error === 404) {
			return <div>Page not found</div>;
		}

		if (typeof this.state.error === 'number') {
			throw new Error('Page load error: ' + this.state.error);
		}

		const page = this.state.page!;
		const draft = this.state.draft!;

		return (
			<div>
				<h1>{page.title}</h1>
				{this.props.member && this.props.member.canManageBlog() ? (
					<Link to={`/page/edit/${page.id}`}>Edit Page</Link>
				) : null}
				<TextDisplay
					editorState={draft.EditorState.createWithContent(
						draft.convertFromRaw(page.content)
					)}
				/>
			</div>
		);
	}
}

class PageEdit extends Page<PageProps<{ id: string }>> {
	public render() {
		return <div />;
	}
}

class PageCreate extends Page {
	public render() {
		return <div />;
	}
}

export default class Pages extends Page {
	public render() {
		return (
			<>
				<Route
					path="/view/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<PageView {...this.props} routeProps={props} />
					)}
				/>
				<Route
					path="/create"
					component={() => <PageCreate {...this.props} />}
				/>
				<Route
					path="/edit/:id"
					component={(props: RouteComponentProps<{ id: string }>) => (
						<PageEdit {...this.props} routeProps={props} />
					)}
				/>
			</>
		);
	}
}
