import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from 'src/components/Button';
import TextDisplay from 'src/components/TextDisplay';
import BlogPost from 'src/lib/BlogPost';
import Loader from '../../components/Loader';
import { EditorState } from '../../lib/slowEditorState';
import { PageProps } from '../Page';

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

export class BlogView extends React.Component<
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
		this.deletePost = this.deletePost.bind(this);
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
					<>
						<Link to={`/news/edit/${this.state.post.id}`}>
							Edit Post
						</Link>
						{' | '}
						<Button
							buttonType="none"
							onClick={this.deletePost}
							className="underline-button"
						>
							Delete post
						</Button>
					</>
				) : null}
				<TextDisplay editorState={editorState} />
			</div>
		);
	}

	private deletePost() {
		if (!this.state.loaded || !this.props.member) {
			return;
		}
		this.state.post.delete(this.props.member).then(() => {
			this.props.routeProps.history.push(`/news`);
		});
	}
}
