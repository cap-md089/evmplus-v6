/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { InputProps } from './Input';

interface MappedTextProps<T, N extends Extract<keyof T, string> = Extract<keyof T, string>>
	extends InputProps<T> {
	name: N;
	value: T[N] extends string ? T : never;
}

export const DisabledMappedText = <T extends {}>({
	name,
	value,
}: MappedTextProps<T>): JSX.Element => (
	<div className="input-formbox">
		<input
			type="text"
			value={((value || ({} as T))[name] as unknown) as string}
			name={'disabledinput'}
			disabled={true}
		/>
	</div>
);

export default DisabledMappedText;
