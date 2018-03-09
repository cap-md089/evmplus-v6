import * as React from 'react';
import { Editor, EditorState } from 'draft-js';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

export default class TextArea extends React.Component {
	state: {
		editorState: EditorState
	};

	editor: Editor | null;

	constructor(props: {}) {
		super(props);
		this.state = {
			editorState: EditorState.createEmpty()
		};
		this.onChange = this.onChange.bind(this);
	}

	public onChange (editorState: EditorState) {
		this.setState({editorState});
		console.log(editorState);
	}

	render () {
		return (
			<div className="textArea">
				<Editor
					ref={el => { this.editor = el; }}
					editorState={this.state.editorState}
					onChange={this.onChange}
				/>
			</div>
		);
	}
}