import { FileDisplayActions } from '../actions/fileDialogue';

export interface FileDialogueState {
	open: boolean;
	returnValue: string[];
}

export default (
	state: FileDialogueState = {
		open: false,
		returnValue: []
	}, 
	action: {
		type: FileDisplayActions,
		returnValue: string[]
	}): FileDialogueState => {
	let nstate = {};

	switch (action.type) {
		case FileDisplayActions.CLOSEDALOGUE :
			let { returnValue } = action;
			nstate = {
				open: false,
				returnValue
			};
			break;
		case FileDisplayActions.DISPLAYDIALOGUE :
			nstate = {
				open: true,
				returnValue: []
			};
			break;
		default :
			nstate = state;
			break;
	}
	return nstate as FileDialogueState;
};