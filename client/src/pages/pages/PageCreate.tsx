import * as React from 'react';
import Loader from 'src/components/Loader';
import SimpleForm, {
	LoadingTextArea,
	TextInput
} from 'src/components/SimpleForm';
import BlogPage from 'src/lib/BlogPage';
import { EditorState } from 'src/lib/slowEditorState';
import Page, { PageProps } from '../Page';

interface UnloadedCreateState {
	loaded: false;
	content: null;
	title: '';
	draft: null;
	error: false;
}

interface LoadedCreateState {
	loaded: true;
	content: EditorState;
	title: string;
	draft: typeof import('draft-js');
	error: false;
}

interface ErrorCreateState {
	loaded: true;
	content: null;
	title: '';
	draft: null;
	error: number;
}

type State = UnloadedCreateState | LoadedCreateState | ErrorCreateState;

interface FormValues {
	content: EditorState;
	title: string;
}

export default class PageCreate extends Page<PageProps, State> {
	public state: State = {
		loaded: false,
		content: null,
		draft: null,
		error: false,
		title: ''
	};

	public constructor(props: PageProps) {
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
				target: '/page/create',
				text: 'Create page'
			}
		]);
		this.props.updateSideNav([]);

		import('draft-js').then(
			draft => {
				this.setState({
					draft,
					title: '',
					content: draft.EditorState.createEmpty(),
					loaded: true
				});
			},
			() => {
				this.setState({
					error: 500
				});
			}
		);
	}

	public render() {
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.props.member.canManageBlog()) {
			return <h2>You don't have permission to do manage the blog</h2>;
		}

		if (!this.state.loaded) {
			return <Loader />;
		}

		if (this.state.error !== false) {
			throw new Error('Could not load draft');
		}

		const PageCreateForm = SimpleForm as new () => SimpleForm<FormValues>;

		const { content, title } = this.state;

		return (
			<>
				<h2>Create page</h2>
				<PageCreateForm
					id="blogPageCreate"
					submitInfo={{
						text: 'Create page',
						className: 'floatAllthewayRight'
					}}
					onSubmit={this.submitForm}
					onChange={this.onFormChange}
					values={{
						content: content!,
						title: title!
					}}
				>
					<TextInput
						name="title"
						fullWidth={true}
						placeholder="Page title"
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
				</PageCreateForm>
			</>
		);
	}

	private onFormChange(values: FormValues) {
		this.setState(values);
	}

	private async submitForm(values: FormValues) {
		if (
			!this.props.member ||
			!this.props.member.canManageBlog() ||
			!this.state.loaded
		) {
			return;
		}

		const newBlogPage = await BlogPage.Create(
			{
				content: this.state.draft!.convertToRaw(
					values.content.getCurrentContent()
				),
				title: values.title
			},
			this.props.member,
			this.props.account
		);

		this.props.routeProps.history.push(`/page/view/${newBlogPage.id}`);
	}
}
