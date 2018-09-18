import * as React from 'react';
import { TextInput } from '../SimpleForm';
import { InputProps } from './Input';

export default (props: InputProps<number>) => (
	<TextInput
		name={props.name}
		value={(props.value || 0).toString()}
		onChange={val =>
			!!val.match(/^\d*$/) &&
			(typeof props.onChange === 'undefined'
				? true
				: props.onChange(parseInt(val, 10)))
		}
		onUpdate={e => {
			if (props.onUpdate && e) {
				props.onUpdate({
					name: e.name,
					value: parseInt(e.value, 10)
				});
			}
		}}
		onInitialize={e => {
			if (props.onInitialize && e) {
				props.onInitialize({
					name: e.name,
					value: parseInt(e.value, 10)
				})
			}
		}}
	/>
);
