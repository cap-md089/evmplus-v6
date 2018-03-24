export const displayDialogue = (
	title: string,
	text: JSX.Element | string,
	buttontext: string = 'Close',
	displayButton: boolean = true,
	onClose: Function = () => null
) => {
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
