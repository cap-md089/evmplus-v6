import { Action } from 'redux';

interface AnyAction extends Action {
	[key: string]: any;
}

export enum FileDisplayActions {
	DISPLAYDIALOGUE,
	CLOSEDALOGUE
}

export interface FileDialogueAction extends Action {
	returnValue: string[];
}

export const fileDisplayDialogue = (): AnyAction => {
	return {
		type: FileDisplayActions.DISPLAYDIALOGUE,
	};
};

export const closeFileDialogue = (returnValue: string[]): AnyAction => {
	return {
		type: FileDisplayActions.CLOSEDALOGUE,
		returnValue
	};
};
