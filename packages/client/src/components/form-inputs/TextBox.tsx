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

// @ts-ignore: this is the one input that doesn't need a name, and it just looks stupid
interface TextBoxProps extends InputProps<undefined> {
	name?: string;
}

export default class TextBox extends React.Component<TextBoxProps> {
	public render = (): JSX.Element => (
		<div
			className="input-formbox"
			style={{ lineHeight: 'initial', paddingTop: 2, paddingBottom: 5 }}
		>
			{this.props.children}
		</div>
	);
}
