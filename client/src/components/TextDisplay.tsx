import * as React from 'react';
import Loader from './Loader';
import { EditorState, ContentState, RawDraftContentState } from 'draft-js';

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

interface ParsedID {
	id: string;
	text: string;
}

export const getIDs = (editorState: EditorState, convertor: (es: ContentState) => RawDraftContentState) => {
	const raw = convertor(editorState.getCurrentContent());

	return getIDsFromRaw(raw);
};

export const getIDsFromRaw = (content: RawDraftContentState) => {
	const parsedIDs: ParsedID[] = [];

	for (const i of content.blocks) {
		if (i.type.substr(0, 6) === 'header') {
			parsedIDs.push({
				id: `content-${i.key}-0-0`,
				text: i.text
			})
		}
	}

	return parsedIDs;
}

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

		const editorState = draft.EditorState.set(this.props.editorState, {
			decorator: text.HeaderDecorator
		});

		return (
			<Editor
				{...this.props}
				blockRendererFn={block =>
					mediaRenderFunction(block, editorState.getCurrentContent())
				}
				editorState={editorState}
				readOnly={true}
				onChange={() => void 0}
			/>
		);
	}
}
