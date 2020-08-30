/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { TextInput } from '../forms/SimpleForm';
import { InputProps } from './Input';

interface NumberInputProps extends InputProps<number | null> {
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

export default React.forwardRef<HTMLInputElement, NumberInputProps>((props, ref) => (
	<TextInput
		ref={ref}
		name={props.name}
		value={props.value === null ? '' : (props.value || 0).toString()}
		shouldUpdate={val =>
			// eslint-disable-next-line
			val === ''
				? true
				: !isNaN(parseInt(val, props.radix || 10)) &&
				  (typeof props.shouldUpdate !== 'undefined'
						? props.shouldUpdate(parseInt(val, props.radix))
						: true)
		}
		onChange={val =>
			typeof props.onChange === 'undefined'
				? void 0
				: val === ''
				? props.onChange(null)
				: props.onChange(parseInt(val, props.radix || 10))
		}
		onUpdate={e => {
			if (props.onUpdate && e) {
				props.onUpdate({
					name: e.name,
					value: e.value === '' ? null : parseInt(e.value, props.radix || 10),
				});
			}
		}}
		disabled={props.disabled}
		onInitialize={e => {
			if (props.onInitialize && e) {
				props.onInitialize({
					name: e.name,
					value: e.value === '' ? null : parseInt(e.value, props.radix || 10),
				});
			}
		}}
		hasError={props.hasError}
		errorMessage={props.errorMessage}
	/>
));
