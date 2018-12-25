import * as React from 'react';
import { EditorState } from 'src/lib/slowEditorState';
import Loader from './Loader';

interface LoadingTextState {
	loaded: false;
	text: null;
	draft: null;
}

interface LoadedTextState {
	loaded: true;
	text: typeof import('./form-inputs/TextArea');
	draft: typeof import('draft-js');
}

type TextState = LoadingTextState | LoadedTextState;

export default class TextDisplay extends React.Component<
	{
		editorState: EditorState;
	},
	TextState
> {
	public state: TextState = {
		loaded: false,
		text: null,
		draft: null
	};

	public componentDidMount() {
		Promise.all([
			import('draft-js'),
			import('./form-inputs/TextArea')
		]).then(([draft, text]) => {
			this.setState({
				loaded: true,
				draft,
				text
			});
		});
	}

	public render() {
		if (!this.state.loaded) {
			return <Loader />;
		}

		const { draft, text } = this.state;

		const { mediaRenderFunction } = text;
		const { Editor } = draft;

		return (
			<Editor
				{...this.props}
				blockRendererFn={block =>
					mediaRenderFunction(
						block,
						this.props.editorState.getCurrentContent()
					)
				}
				readOnly={true}
				onChange={() => void 0}
			/>
		);
	}
}
