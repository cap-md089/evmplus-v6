import * as React from 'react';
import { Link, Route, RouteComponentProps } from 'react-router-dom';
import BlogPost from 'src/lib/BlogPost';
import Loader from '../components/Loader';
import SimpleForm, {
	FileInput,
	Label,
	LoadingTextArea,
	TextInput
} from '../components/SimpleForm';
import { EditorState } from '../lib/slowEditorState';
import './blog.css';
import Page, { PageProps } from './Page';
import TextDisplay from 'src/components/TextDisplay';
import Pager from 'src/components/Pager';
import { SideNavigationReferenceLink, SideNavigationItem } from 'src/components/SideNavigation';

type DraftJS = typeof import('draft-js');

const POSTS_PER_PAGE = 10;

interface BlogListState1 {
	posts: null;
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: false;
	draft: null;
}

interface BlogListState2 {
	posts: BlogPost[];
	displayLeft: boolean;
	displayRight: boolean;
	page: number;
	loaded: true;
	draft: DraftJS;
}

class BlogList extends React.Component<
	PageProps<{ page?: string }>,
	BlogListState1 | BlogListState2
> {
	constructor(props: PageProps) {
		super(props);

		this.state = {
			posts: null,
			page:
				parseInt(this.props.routeProps.match.params.page || '1', 10),
			displayLeft: false,
			displayRight: false,
			loaded: false,
			draft: null
		};

		this.changePageNumber = this.changePageNumber.bind(this);
	}

	public componentDidMount() {
		const page = this.props.routeProps.match.params.page;
		if (page) {
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/news',
					text: 'News'
				},
				{
					target: '/news/page/' + page,
					text: 'Page ' + page
				}
			]);

			const pageURL = `/news/page/${page}`;

			if (this.props.routeProps.location.pathname !== pageURL) {
				this.props.routeProps.history.replace(pageURL);
			}

			this.setState({
				page: parseInt(page.toString(), 10)
			});
		} else {
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
		}

		if (this.props.account) {
			Promise.all([
				this.props.account.getBlogPosts(),
				import('draft-js')
			]).then(([posts, draft]) => {
				this.setState({
					loaded: true,
					posts,
					draft
				});
			});
		}
	}

	public render() {
		if (!this.state.loaded) {
			return <Loader />;
		}
		const draft = this.state.draft;
		const Editor = draft.Editor;

		const PostPager = Pager as new () => Pager<BlogPost>;

		return (
			<div>
				{this.props.member && this.props.member.canManageBlog() ? (
					<Link to="/news/post">Create post</Link>
				) : null}
				{this.state.posts.length === 0 ? (
					<h1>No blog posts</h1>
				) : (
					<PostPager
						dataCountPerPage={POSTS_PER_PAGE}
						dataset={this.state.posts}
						onChangePageNumber={this.changePageNumber}
						page={this.state.page}
						renderFunction={post => (
							<div className="blog-post">
								<Link to={`/news/view/${post.id}`}>
									<h1>{post.title}</h1>
								</Link>
								<Editor
									editorState={draft.EditorState.createWithContent(
										draft.convertFromRaw(post.content)
									)}
									readOnly={true}
									onChange={() => void 0}
								/>
							</div>
						)}
					/>
				)}
			</div>
		);
	}

	private changePageNumber(page: number, posts: BlogPost[]) {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/news',
				text: 'News'
			},
			{
				target: '/news/page/' + page,
				text: 'Page ' + page
			}
		]);

		const pageURL = `/news/page/${page}`;

		if (this.props.routeProps.location.pathname !== pageURL) {
			this.props.routeProps.history.replace(pageURL);
		}

		this.setState({
			page
		});

		this.props.updateSideNav(posts.map((post, i) => ((
			<SideNavigationReferenceLink
				target={i.toString()}
			>
				{post.title}
			</SideNavigationReferenceLink>
		) as unknown as SideNavigationItem)), true);
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

	constructor(props: PageProps<any>) {
		super(props);

		this.submitForm = this.submitForm.bind(this);
		this.onFormChange = this.onFormChange.bind(this);
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
			},
			{
				target: '/news/create',
				text: 'Create post'
			}
		]);
		this.props.updateSideNav([]);

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
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.props.member.canManageBlog()) {
			return <h2>You don't have permission to do that</h2>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}

		const PostCreateForm = SimpleForm as new () => SimpleForm<{
			title: string;
			content: EditorState;
			fileIDs: string[];
		}>;

		const { content, title, fileIDs } = this.state;

		return (
			<>
				<h2>Create blog post</h2>
				<PostCreateForm
					id="blogPostCreate"
					submitInfo={{
						text: 'Create blog post',
						className: 'floatAllthewayRight'
					}}
					onSubmit={this.submitForm}
					onChange={this.onFormChange}
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
					<LoadingTextArea
						name="content"
						fullWidth={true}
						account={this.props.account}
						member={this.props.member}
					/>
					<Label>Photos to display</Label>
					<FileInput
						name="fileIDs"
						account={this.props.account}
						member={this.props.member}
					/>
				</PostCreateForm>
			</>
		);
	}

	private submitForm(postData: {
		title: string;
		content: EditorState;
		fileIDs: string[];
	}) {
		if (!this.props.member || !this.state.loaded) {
			return;
		}

		const newPost: NewBlogPost = {
			content: this.state.draft.convertToRaw(
				postData.content.getCurrentContent()
			),
			fileIDs: postData.fileIDs,
			title: postData.title
		};

		BlogPost.Create(newPost, this.props.member, this.props.account).then(
			fullPost => {
				this.props.routeProps.history.push(`/news/view/${fullPost.id}`);
			}
		);
	}

	private onFormChange(postData: {
		title: string;
		content: EditorState;
		fileIDs: string[];
	}) {
		this.setState({
			title: postData.title,
			content: postData.content,
			fileIDs: postData.fileIDs
		});
	}
}

interface ReadyBlogEdit {
	loaded: true;
	draft: typeof import('draft-js');
	editorState: EditorState;
	post: BlogPost;
}

interface UnreadyBlogEdit {
	loaded: false;
	draft: null;
	editorState: null;
	post: null;
}

class BlogEdit extends React.Component<
	PageProps<{ id: string }>,
	ReadyBlogEdit | UnreadyBlogEdit
> {
	public state: UnreadyBlogEdit | ReadyBlogEdit = {
		draft: null,
		editorState: null,
		loaded: false,
		post: null
	};

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.submitForm = this.submitForm.bind(this);
	}

	public async componentDidMount() {
		const [post, draft] = await Promise.all([
			BlogPost.Get(
				parseInt(
					this.props.routeProps.match.params.id.split('-')[0],
					10
				)
			),
			import('draft-js')
		]);

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/news',
				text: 'News'
			},
			{
				target: '/news/edit/' + this.props.routeProps.match.params.id,
				text: 'Edit post "' + post.title + '"'
			}
		]);
		this.props.updateSideNav([]);

		const postURL = `/news/edit/${
			post.id
		}-${post.title.toLocaleLowerCase().replace(/ /g, '-')}`;

		if (this.props.routeProps.location.pathname !== postURL) {
			this.props.routeProps.history.replace(postURL);
		}

		this.setState({
			loaded: true,
			post,
			editorState: draft.EditorState.createWithContent(
				draft.convertFromRaw(post.content)
			),
			draft
		});
	}

	public render() {
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.props.member.canManageBlog()) {
			return <h2>You don't have permission to do that</h2>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}

		const PostEditForm = SimpleForm as new () => SimpleForm<{
			title: string;
			content: EditorState;
			fileIDs: string[];
		}>;

		const { post, editorState: content } = this.state;
		const { title, fileIDs } = post;

		return (
			<>
				<h2>Create blog post</h2>
				<Link
					to={`/news/view/${this.props.routeProps.match.params.id}`}
				>
					View post
				</Link>
				<PostEditForm
					id="blogPostCreate"
					submitInfo={{
						text: 'Save blog post',
						className: 'floatAllthewayRight'
					}}
					onSubmit={this.submitForm}
					onChange={this.onFormChange}
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
					<LoadingTextArea
						name="content"
						fullWidth={true}
						account={this.props.account}
						member={this.props.member}
					/>
					<Label>Photos to display</Label>
					<FileInput
						name="fileIDs"
						account={this.props.account}
						member={this.props.member}
					/>
				</PostEditForm>
			</>
		);
	}

	private submitForm(postData: {
		title: string;
		content: EditorState;
		fileIDs: string[];
	}) {
		if (!this.props.member || !this.state.loaded) {
			return;
		}

		const newPost: NewBlogPost = {
			content: this.state.draft.convertToRaw(
				postData.content.getCurrentContent()
			),
			fileIDs: postData.fileIDs,
			title: postData.title
		};

		this.state.post.set(newPost);

		this.state.post.save(this.props.member);

		this.props.routeProps.history.push(
			`/news/view/${this.state.post.id}`
		)
	}

	private onFormChange(postData: {
		title: string;
		content: EditorState;
		fileIDs: string[];
	}) {
		if (!this.state.loaded) {
			return;
		}

		const newPost: NewBlogPost = {
			content: this.state.draft.convertToRaw(
				postData.content.getCurrentContent()
			),
			fileIDs: postData.fileIDs,
			title: postData.title
		};

		this.state.post.set(newPost);

		this.setState({
			editorState: postData.content
		});
	}
}

interface ReadyBlogView {
	loaded: true;
	draft: typeof import('draft-js');
	editorState: EditorState;
	post: BlogPost;
}

interface UnreadyBlogView {
	loaded: false;
	draft: null;
	editorState: null;
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
		editorState: null,
		loaded: false
	};
	constructor(
		props: PageProps<{
			id: string;
		}>
	) {
		super(props);
	}

	public async componentDidMount() {
		const [post, draft] = await Promise.all([
			BlogPost.Get(
				parseInt(
					this.props.routeProps.match.params.id.split('-')[0],
					10
				)
			),
			import('draft-js')
		]);

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/news',
				text: 'News'
			},
			{
				target: '/news/view/' + this.props.routeProps.match.params.id,
				text: 'View post "' + post.title + '"'
			}
		]);
		this.props.updateSideNav([]);

		const postURL = `/news/view/${
			post.id
		}-${post.title.toLocaleLowerCase().replace(/ /g, '-')}`;

		if (this.props.routeProps.location.pathname !== postURL) {
			this.props.routeProps.history.replace(postURL);
		}

		this.setState({
			loaded: true,
			post,
			editorState: draft.EditorState.createWithContent(
				draft.convertFromRaw(post.content)
			),
			draft
		});
	}

	public render() {
		if (this.state.loaded === false) {
			return <Loader />;
		}

		const { post, editorState } = this.state;

		return (
			<div>
				<h1>{post.title}</h1>
				{this.props.member && this.props.member.canManageBlog() ? (
					<Link to={`/news/edit/${this.state.post.id}`}>
						Edit Post
					</Link>
				) : null}
				<TextDisplay
					editorState={editorState}
				/>
				<div id="photobank">{post.fileIDs.map(this.photoView)}</div>
			</div>
		);
	}

	public photoView(id: string) {
		return (
			<div className="photo-view">
				<img src={`/api/files/${id}/export`} />
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
