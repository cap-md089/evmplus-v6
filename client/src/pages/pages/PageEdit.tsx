import * as React from 'react';
import { LoadingTextArea, TextInput } from 'src/components/Form';
import Loader from 'src/components/Loader';
import SimpleForm from 'src/components/SimpleForm';
import BlogPage from 'src/lib/BlogPage';
import { EditorState } from 'src/lib/slowEditorState';
import Page, { PageProps } from '../Page';

type DraftJS = typeof import('draft-js');

interface FormValues {
	content: EditorState;
	title: string;
}

interface UnloadedPageClass {
	page: null;
	loaded: false;
	draft: null;
	error: false;
	content: null;
}

interface LoadedPageClass {
	page: BlogPage;
	loaded: true;
	draft: DraftJS;
	error: false;
	content: EditorState;
}

interface ErrorPageClass {
	page: null;
	loaded: true;
	draft: null;
	error: number;
	content: null;
}

export default class PageEdit extends Page<
	PageProps<{ id: string }>,
	UnloadedPageClass | LoadedPageClass | ErrorPageClass
> {
	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.state = {
			page: null,
			loaded: false,
			draft: null,
			error: false,
			content: null
		};

		this.onFormChange = this.onFormChange.bind(this);
		this.onFormSubmit = this.onFormSubmit.bind(this);
	}

	public async componentDidMount() {
		const id = this.props.routeProps.match.params.id;


		if (!id) {
			this.setState({
				error: 404,
				loaded: true
			});

			return;
		}

		let page;
		let draft;

		try {
			[page, draft] = await Promise.all([
				BlogPage.Get(id),
				import('draft-js')
			]);
		} catch (e) {
			this.setState({
				loaded: true,
				error: 404
			});
			return;
		}

		this.setState({
			page,
			draft,
			loaded: true,
			error: false,
			content: draft.EditorState.createWithContent(
				draft.convertFromRaw(page.content)
			)
		});

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
	}

	public render() {
		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.props.member.canManageBlog()) {
			return <h2>You don't have permission to do that</h2>;
		}

		if (!this.state.loaded) {
			return <Loader />;
		}

		if (this.state.error === 404) {
			return <div>Page not found</div>;
		}

		if (typeof this.state.error === 'number') {
			throw new Error('Page load error: ' + this.state.error);
		}

		const PageCreateForm = SimpleForm as new () => SimpleForm<FormValues>;

		const page = this.state.page!;

		const { title } = page;
		const { content } = this.state;

		return (
			<div>
				<h2>Edit page</h2>
				<PageCreateForm
					id="blogPageCreate"
					submitInfo={{
						text: 'Create page',
						className: 'floatAllthewayRight'
					}}
					onSubmit={this.onFormSubmit}
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
			</div>
		);
	}

	private onFormChange(values: FormValues) {
		this.state.page!.title = values.title;
		this.setState({
			content: values.content
		});
	}

	private onFormSubmit(values: FormValues) {
		if (
			!this.props.member ||
			!this.props.member.canManageBlog() ||
			!this.state.loaded
		) {
			return;
		}

		this.state.page!.title = values.title;
		this.state.page!.content = this.state.draft!.convertToRaw(
			values.content.getCurrentContent()
		);

		this.state.page!.save(this.props.member).then(() => {
			this.props.routeProps.history.push(
				`/page/view/${this.state.page!.id}`
			);
		});
	}
}
