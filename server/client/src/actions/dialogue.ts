import { Action } from 'redux';

interface AnyAction extends Action {
	[key: string]: any;
}

export interface DialogueAction extends Action {
	title: string;
	text: JSX.Element | string;
	buttontext: string;
	displayButton: boolean;
	onClose: () => void;
}

export const displayDialogue = (
	title: string,
	text: JSX.Element | string,
	buttontext: string = 'Close',
	displayButton: boolean = true,
	onClose: Function = () => undefined
): AnyAction => {
	return {
		type: 'DISPLAY_DIALOGUE',
		title,
		text,
		buttontext,
		displayButton,
		onClose
	};
};

export const closeDialogue = () => {
	return {
		type: 'CLOSE_DIALOGUE'
	};
};
