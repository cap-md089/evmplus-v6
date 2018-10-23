import { EditorProps } from 'draft-js';
import * as React from 'react';
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

export default class LoadingText extends React.Component<
	EditorProps,
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
			/>
		);
	}
}
