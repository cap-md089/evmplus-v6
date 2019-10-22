import * as React from 'react';
import MemberBase from '../../lib/Members';
import Account from '../../lib/Account';

export interface InputProps<V> {
	// Callback handler
	/**
	 * Function called whenever the user enters something and updates the values
	 *
	 * @param {V} val The value of the input
	 */
	onChange?: (val: V) => void;
	/**
	 * Function called whenever the user enters something and updates the values
	 *
	 * Meant to be used by the Form class (and its derivatives)
	 *
	 * @param {{name: string, value: V}} event The form event
	 */
	onUpdate?: (e: { name: string; value: V }) => void;
	/**
	 * Function called when the form component initializes
	 *
	 * Meant to be used by the Form class (and its derivatives)
	 *
	 * @param {{name: string, value: V}} event The form event
	 */
	onInitialize?: (e: { name: string; value: V }) => void;

	// Implement HTML form stuff
	/**
	 * The identifier of the input
	 */
	name: string;
	/**
	 * The value of the input
	 *
	 * Denoted as required because all components need to be controlled
	 */
	value?: V;

	// Pass on styles to children
	/**
	 * Used to style the div that holds the input, not always used
	 */
	boxStyles?: React.CSSProperties;
	/**
	 * Used to style the input itself, not always used
	 */
	inputStyles?: React.CSSProperties;
	/**
	 * Used by ListEditor. Useful for when handling multiple radio fields
	 */
	index?: number;
	/**
	 * Used by some components. They should throw an error if they are not defined
	 */
	member?: MemberBase | null;
	account?: Account | null;
	/**
	 * Whether or not there is an error with this component
	 *
	 * Not all components implement this
	 */
	hasError?: boolean;
	/**
	 * An error message to display if this component has an error
	 *
	 * Not all components implement this
	 */
	errorMessage?: string;
}

export interface NotOptionalInputProps<V> extends InputProps<V> {
	member: MemberBase;
	account: Account;
}
