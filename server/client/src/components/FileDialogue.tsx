import * as React from 'react';
import { connect } from 'react-redux';
import { closeFileDialogue } from '../actions/fileDialogue';

enum FileDialogueView {
	MYDRIVE,
	// SHAREDWITHME,
	// RECENT,
	UPLOAD
}

interface FileDialogueState {
	open: boolean;
	returnValue: string[];
}

class FileDialogue extends React.Component<{
	isMobile: boolean,

	open: boolean;
	returnValue: string[];

	closeDialogue: () => void
}, {
	pane: FileDialogueView
}> {
	render () {
		if (!this.props.open) {
			return null;
		}

		return (
			<div />
		);
	}
}

export default connect(
	(state: {FileDialogue: FileDialogueState}) => {
		return state.FileDialogue;
	},
	(dispatch) => {
		return {
			closeDialogue: (returnValue: string[]) => {
				dispatch(closeFileDialogue(returnValue));
			}
		};
	}
)(FileDialogue);