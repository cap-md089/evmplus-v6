import * as React from 'react';
import { Link } from 'react-router-dom';
import Loader from 'src/components/Loader';
import TextDisplay from 'src/components/TextDisplay';
import BlogPage from 'src/lib/BlogPage';
import Page, { PageProps } from '../Page';
import Button from 'src/components/Button';

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

export default class PageView extends Page<PageProps<{ id: string }>, PageState> {
	public state: PageState = {
		page: null,
		loaded: false,
		draft: null,
		error: false
	};

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.deletePage = this.deletePage.bind(this);
	}

	public async componentDidMount() {
		const id = this.props.routeProps.match.params.id;
		if (id) {
			try {
				const [page, draft] = await Promise.all([BlogPage.Get(id), import('draft-js')]);

				// TODO: Add an implementation for side nav to
				// navigate to children and to headers in page

				this.props.updateBreadCrumbs([
					{
						target: '/',
						text: 'Home'
					},
					...page.ancestry.map(item => ({
						target: `/page/view/${item.id}`,
						text: item.title
					})),
					{
						target: `/page/view/${page.id}`,
						text: page.title
					}
				]);
				this.updateTitle(page.title);
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
				<h1 id="pagetitle">{page.title}</h1>
				{this.props.member && this.props.member.canManageBlog() ? (
					<>
						<Link to={`/page/edit/${page.id}`}>Edit Page</Link>
						{' | '}
						<Button
							onClick={this.deletePage}
							className="underline-button"
							buttonType="none"
						>
							Delete page
						</Button>
					</>
				) : null}
				<TextDisplay
					editorState={draft.EditorState.createWithContent(
						draft.convertFromRaw(page.content)
					)}
				/>
			</div>
		);
	}

	private deletePage() {
		if (this.state.page && this.props.member) {
			this.state.page.delete(this.props.member);
		}
	}
}
