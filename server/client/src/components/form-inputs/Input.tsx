import * as React from 'react';

export interface InputProps {
	// Callback handler
	onChange?: (e?: React.FormEvent<HTMLInputElement>, str?: string) => void;
	onUpdate?: (e?: React.FormEvent<HTMLInputElement>) => void;
	
	// Implement HTML form stuff
	name: string;
	value?: string;

	// Pass on styles to children
	boxStyles?: Object;
	inputStyles?: Object;
}

export interface InputState {
	value: string;
}