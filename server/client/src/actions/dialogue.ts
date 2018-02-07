export const displayDialogue = (title: string, text: string) => {
	return {
		type: 'DISPLAY_DIALOGUES',
		title,
		text
	};
};

export const closeDialogue = () => {
	return {
		type: 'CLOSE_DIALOGUE'
	};
};
