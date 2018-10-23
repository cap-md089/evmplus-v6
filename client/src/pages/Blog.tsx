import { EditorState } from 'draft-js';
import * as React from 'react';
import { Link, Route } from 'react-router-dom';
import Loader from '../components/Loader';
import {
	FileInput,
	Label,
	LoadingTextArea,
	TextInput
} from '../components/SimpleForm';
/// <reference path="../../../lib/index.d.ts" />
import RequestForm from '../components/SimpleRequestForm';
import myFetch from '../lib/myFetch';
import './blog.css';
import Page, { PageProps } from './Page';

type DraftJS = typeof import('draft-js');

interface BlogListState1 {
	posts: null;
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: false;
	draft: null;
}

interface BlogListState2 {
	posts: BlogPostObject[];
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: true;
	draft: DraftJS;
}

class BlogList extends React.Component<
	PageProps,
	BlogListState1 | BlogListState2
> {
	constructor(props: PageProps) {
		super(props);
		this.state = {
			posts: null,
			page: 0,
			displayLeft: false,
			displayRight: false,
			loaded: false,
			draft: null
		};
	}

	public componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/news',
				text: 'News'
			}
		]);
		Promise.all([
			myFetch('/api/blog/post/list').then(val =>
				val.json()
			),
			import('draft-js')
		]).then(([posts, draft]) => {
			this.setState({
				loaded: true,
				posts,
				draft
			});
		});
	}

	public render() {
		if (!this.state.loaded) {
			return <Loader />;
		}
		const draft = this.state.draft;
		const Editor = draft.Editor;

		return this.state.posts.length === 0 ? (
			<h1>No blog posts</h1>
		) : (
			<div>
				{this.state.posts.map((post, i) => {
					return (
						<div key={i} className="blog-post">
							<Link to={'/blog/view/' + post.id}>
								<h1>{post.title}</h1>
							</Link>
							<Editor
								editorState={draft.EditorState.createWithContent(
									draft.convertFromRaw(post.content)
								)}
								readOnly={true}
								onChange={() => null}
							/>
						</div>
					);
				})}
			</div>
		);
	}
}

interface BlogPostCreateNotReady {
	loaded: false;
	draft: null;
	content: null;
	fileIDs: never[];
	title: null;
}

interface ReadyBlogPostCreate {
	loaded: true;
	draft: DraftJS;
	content: EditorState;
	fileIDs: string[];
	title: string;
}

class BlogPostCreate extends React.Component<
	PageProps<any>,
	ReadyBlogPostCreate | BlogPostCreateNotReady
> {
	public state: ReadyBlogPostCreate | BlogPostCreateNotReady = {
		loaded: false,
		draft: null,
		fileIDs: [],
		content: null,
		title: null
	};

	public componentDidMount() {
		import('draft-js').then(draft => {
			this.setState({
				loaded: true,
				draft,
				fileIDs: [],
				content: draft.EditorState.createEmpty(),
				title: ''
			});
		});
	}

	public render() {
		if (this.props.member.valid === false) {
			return <h2>Please sign in</h2>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}
		const PostCreateForm = RequestForm as new () => RequestForm<
			{
				title: string;
				content: EditorState;
				fileIDs: string[];
			},
			BlogPostObject
		>;

		const { draft, content, title, fileIDs } = this.state;

		return (
			<>
				<h2>Create blog post</h2>
				<PostCreateForm
					url="/api/blog/post"
					id="blogPostCreate"
					submitInfo={{
						text: 'Create blog post',
						className: 'floatAllthewayRight'
					}}
					onSubmit={post => ({
						title: post.title,
						content: draft.convertToRaw(
							post.content.getCurrentContent()
						),
						authorid: this.props.member.member!.object.id,
						fileIDs: post.fileIDs
					})}
					onReceiveData={post => {
						this.props.routeProps.history.push(
							'/blog/view/' + post.id
						);
					}}
					values={{
						content,
						title,
						fileIDs
					}}
				>
					<TextInput
						name="title"
						fullWidth={true}
						placeholder="Post title..."
						boxStyles={{
							margin: 0,
							padding: 0,
							marginBottom: -11
						}}
						inputStyles={{
							backgroundColor: '#fff',
							borderRadius: 0,
							padding: 10,
							borderBottomWidth: 0,
							borderColor: '#aaa'
						}}
					/>
					<LoadingTextArea name="content" fullWidth={true} />
					<Label>Photos to display</Label>
					<FileInput name="fileIDs" />
				</PostCreateForm>
			</>
		);
	}
}

class BlogEdit extends React.Component<PageProps> {}

interface ReadyBlogView {
	loaded: true;
	draft: typeof import('draft-js');
	post: BlogPostObject;
}

interface UnreadyBlogView {
	loaded: false;
	draft: null;
	post: null;
}

class BlogView extends React.Component<
	PageProps<{
		id: string;
	}>,
	UnreadyBlogView | ReadyBlogView
> {
	public state: UnreadyBlogView | ReadyBlogView = {
		post: null,
		draft: null,
		loaded: false
	};
	constructor(
		props: PageProps<{
			id: string;
		}>
	) {
		super(props);
	}

	public componentDidMount() {
		myFetch('/api/blog/post/' + this.props.routeProps.match.params.id)
			.then(val => val.json())
			.then((post: BlogPostObject) => this.setState({ post }));
	}

	public render() {
		if (this.state.loaded === false) {
			return <Loader />;
		}

		const { post, draft } = this.state;

		return (
			<div>
				<h1>{post.title}</h1>
				<draft.Editor
					editorState={EditorState.createWithContent(
						draft.convertFromRaw(post.content)
					)}
					onChange={() => null}
					readOnly={true}
				/>
			</div>
		);
	}
}

export default class Blog extends Page<PageProps<{ id: string }>> {
	public render() {
		return (
			<>
				<Route
					exact={true}
					path="/blog"
					component={() => <BlogList {...this.props} />}
				/>
				<Route
					path="/blog/post"
					component={() => <BlogPostCreate {...this.props} />}
				/>
				<Route
					path="/blog/view/:id"
					component={() => <BlogView {...this.props} />}
				/>
				<Route
					path="/blog/edit/:id"
					component={() => <BlogEdit {...this.props} />}
				/>
				<Route
					exact={true}
					path="/news"
					component={() => <BlogList {...this.props} />}
				/>
				<Route
					path="/news/post"
					component={() => <BlogPostCreate {...this.props} />}
				/>
				<Route
					path="/news/view/:id"
					component={() => <BlogView {...this.props} />}
				/>
				<Route
					path="/news/edit/:id"
					component={() => <BlogEdit {...this.props} />}
				/>
			</>
		);
	}
}
