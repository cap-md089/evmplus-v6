import * as React from 'react';
import { Link } from 'react-router-dom';
import BlogPost from 'src/lib/BlogPost';
import Loader from '../../components/Loader';
import SimpleForm, {
	LoadingTextArea,
	TextInput
} from '../../components/SimpleForm';
import { EditorState } from '../../lib/slowEditorState';
import { PageProps } from '../Page';

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

export class BlogEdit extends React.Component<
	PageProps<{
		id: string;
	}>,
	ReadyBlogEdit | UnreadyBlogEdit
> {
	public state: UnreadyBlogEdit | ReadyBlogEdit = {
		draft: null,
		editorState: null,
		loaded: false,
		post: null
	};
	constructor(
		props: PageProps<{
			id: string;
		}>
	) {
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
		}>;
		const { post, editorState: content } = this.state;
		const { title } = post;
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
						title
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
			title: postData.title
		};
		this.state.post.set(newPost);
		this.state.post.save(this.props.member);
		this.props.routeProps.history.push(`/news/view/${this.state.post.id}`);
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
			title: postData.title
		};
		this.state.post.set(newPost);
		this.setState({
			editorState: postData.content
		});
	}
}
