/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { always, Either, Maybe } from 'common-lib';
import * as React from 'react';
import { FormInput, getInputChangeAction } from '../forms-2/Form';

/**
 * These options can be used to configure a text input to act differently
 */
export interface TextInputOptions {
	ref?: React.Ref<HTMLInputElement>;
	password?: boolean;
	placeholder?: string;
	disabled?: boolean;
	errorMessage?: string;
	shouldUpdate: (val: string) => boolean;
}

const defaultOptions: TextInputOptions = {
	shouldUpdate: always(true),
};

/**
 * Creates a text input that follows the configuration provided to it
 *
 * @param name the name given to the text input
 * @param options extra options to configure the behavior of the text input
 */
export const createTextInput: (
	name: string,
	options?: Partial<TextInputOptions>,
) => FormInput<string, string> = (name, options) => {
	const usedOptions = {
		...defaultOptions,
		...options,
	};

	const inputChangeAction = getInputChangeAction<string>(name);

	return {
		component: (model, dispatch) => (
			<>
				<input
					type={usedOptions.password ? 'password' : 'text'}
					value={model.value}
					onChange={e =>
						usedOptions.shouldUpdate(e.target.value) &&
						dispatch(inputChangeAction(e.target.value))
					}
					name={name}
					placeholder={usedOptions.placeholder}
					disabled={usedOptions.disabled}
					ref={usedOptions.ref}
				/>
				{!model.changed || Maybe.isNone(model.error) ? null : usedOptions.errorMessage ? (
					<span className="text-error">{usedOptions.errorMessage}</span>
				) : (
					<span className="text-error">{model.error.value.message}</span>
				)}
			</>
		),
		collapse: Either.right,
	};
};
