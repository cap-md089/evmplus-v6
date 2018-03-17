import * as React from 'react';

import { Editor, EditorState } from 'draft-js';

import { InputProps } from './Input';

export default class TextArea extends React.Component<InputProps<string>, {
	editorState: EditorState
}> {
	constructor (props: InputProps<string>) {
		super(props);
		this.state = {
			editorState: EditorState.createEmpty()
		};
		this.onChange = this.onChange.bind(this);
	}

	onChange (editorState: EditorState) {
		this.setState({
			editorState
		});
	}

	render () {
		return (
			<div className="formbox">
				<Editor
					{...this.props}
					editorState={this.state.editorState}
					onChange={this.onChange}
				/>
			</div>
		);
	}
}