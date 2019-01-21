import * as React from 'react';
import { TextInput } from '../SimpleForm';
import { InputProps } from './Input';

interface NumberInputProps extends InputProps<number> {
	/**
	 * Defaults to 10
	 */
	radix?: number;
	/**
	 * Should the input be disabled?
	 */
	disabled?: boolean;
	/**
	 * Repeat text input property
	 */
	shouldUpdate?: (value: number) => boolean;
}

export default (props: NumberInputProps) => (
	<TextInput
		name={props.name}
		value={props.value === null ? '' : (props.value || 0).toString()}
		shouldUpdate={val =>
			parseInt(val, props.radix || 10) ===
				parseInt(val, props.radix || 10) &&
			(typeof props.shouldUpdate !== 'undefined'
				? props.shouldUpdate(parseInt(val, props.radix))
				: true)
		}
		onChange={val =>
			typeof props.onChange === 'undefined'
				? void 0
				: props.onChange(parseInt(val, props.radix || 10))
		}
		onUpdate={e => {
			if (props.onUpdate && e) {
				props.onUpdate({
					name: e.name,
					value: parseInt(e.value, props.radix || 10)
				});
			}
		}}
		disabled={props.disabled}
		onInitialize={e => {
			if (props.onInitialize && e) {
				props.onInitialize({
					name: e.name,
					value: parseInt(e.value, props.radix || 10)
				});
			}
		}}
	/>
);
