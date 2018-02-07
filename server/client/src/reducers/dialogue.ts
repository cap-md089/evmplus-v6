export interface DialogueState {
	open: boolean;
	title: string;
	text: string;
}

const dialogue = (
	state: DialogueState = {
		open: false,
		text: '',
		title: ''
	}, 
	action: {
		type: string,
		title?: string,
		text?: string
	}): DialogueState => {
	let nstate = { ...state };

	switch (action.type) {
		case 'CLOSE_DIALOGUE' :
			nstate = {
				open: false,
				title: '',
				text: ''
			};
			break;
		case 'DISPLAY_DIALOGUE' :
			let title = action.title ? action.title : '';
			let text = action.text ? action.text : '';
			nstate = {
				open: true,
				title: title,
				text: text
			};
			break;
		default :
			return state;
	}
	return nstate;
};

export default dialogue;