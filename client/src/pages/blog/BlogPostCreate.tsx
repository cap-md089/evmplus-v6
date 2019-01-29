import * as React from 'react';
import BlogPost from 'src/lib/BlogPost';
import Loader from '../../components/Loader';
import SimpleForm, {
	LoadingTextArea,
	TextInput
} from '../../components/forms/SimpleForm';
import { EditorState } from '../../lib/slowEditorState';
import Page, { PageProps } from '../Page';

type DraftJS = typeof import('draft-js');

interface BlogPostCreateNotReady {
	loaded: false;
	draft: null;
	content: null;
	title: null;
}

interface ReadyBlogPostCreate {
	loaded: true;
	draft: DraftJS;
	content: EditorState;
	title: string;
}

export class BlogPostCreate extends Page<
	PageProps<any>,
	ReadyBlogPostCreate | BlogPostCreateNotReady
> {
	public state: ReadyBlogPostCreate | BlogPostCreateNotReady = {
		loaded: false,
		draft: null,
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
		this.updateTitle('Create post');
		this.props.updateSideNav([]);
		import('draft-js').then(draft => {
			this.setState({
				loaded: true,
				draft,
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
		}>;

		const { content, title } = this.state;

		return (
			<>
				<h2>Create post</h2>
				<PostCreateForm
					id="blogPostCreate"
					submitInfo={{
						text: 'Create post',
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
				</PostCreateForm>
			</>
		);
	}
	private submitForm(postData: { title: string; content: EditorState }) {
		if (!this.props.member || !this.state.loaded) {
			return;
		}

		const newPost: NewBlogPost = {
			content: this.state.draft.convertToRaw(
				postData.content.getCurrentContent()
			),
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
	}) {
		this.setState({
			title: postData.title,
			content: postData.content,
		});
	}
}
