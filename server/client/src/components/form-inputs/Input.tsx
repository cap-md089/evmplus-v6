import * as React from 'react';

export interface InputProps<V> {
	// Callback handler
	/**
	 * Function called whenever the user enters something and updates the values
	 * 
	 * @param {React.FormEvent<HTMLInputElement>} event The form event
	 * @param {V} val The value of the input
	 */
	onChange?: (e?: React.FormEvent<HTMLInputElement>, val?: V) => void;
	/**
	 * Function called whenever the user enters something and updates the values
	 * 
	 * Meant to be used by the Form class (and its derivatives)
	 * 
	 * @param {React.FormEvent<HTMLInputElement>} event The form event
	 */
	onUpdate?: (e?: React.FormEvent<HTMLInputElement>) => void;
	
	// Implement HTML form stuff
	/**
	 * The identifier of the input
	 */
	name: string;
	/**
	 * The value of the input
	 */
	value?: V;

	// Pass on styles to children
	/**
	 * Used to style the div that holds the input
	 */
	boxStyles?: React.CSSProperties;
	/**
	 * Used to style the input itself
	 */
	inputStyles?: React.CSSProperties;
}

export interface InputState {
	value: string;
}