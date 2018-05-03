export interface DialogueState {
	open: boolean;
	title: string;
	text: JSX.Element | string;
	buttontext: string;
	displayButton: boolean;
	onClose: Function;
}

const dialogue = (
	state: DialogueState = {
		open: false,
		text: '',
		title: '',
		buttontext: '',
		displayButton: true,
		onClose: () => null
	}, 
	action: {
		type: string,
		title?: string,
		text?: string,
		buttontext?: string,
		displayButton?: boolean,
		onClose?: Function
	}): DialogueState => {
	let nstate = { ...state };

	switch (action.type) {
		case 'CLOSE_DIALOGUE' :
			nstate = {
				open: false,
				title: '',
				text: '',
				buttontext: '',
				displayButton: true,
				onClose: () => null
			};
			break;
		case 'DISPLAY_DIALOGUE' :
			let title = action.title ? action.title : '';
			let text = action.text ? action.text : '';
			let buttontext = action.buttontext ? action.buttontext : 'Close';
			let onClose = action.onClose ? action.onClose : () => null;
			let displayButton = typeof action.displayButton === 'undefined' ? true : action.displayButton;
			nstate = {
				open: true,
				title,
				text,
				buttontext,
				onClose,
				displayButton
			};
			break;
		default :
			return state;
	}
	return nstate;
};

export default dialogue;