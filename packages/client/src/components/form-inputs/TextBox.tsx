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

import * as React from 'react';
import { InputProps } from './Input';

// @ts-ignore
interface TextBoxProps extends InputProps<undefined> {
	name?: string;
}

export default class TextBox extends React.Component<TextBoxProps> {
	public render() {
		return (
			<div
				className="input-formbox"
				style={{ lineHeight: 'initial', paddingTop: 2, paddingBottom: 5 }}
			>
				{this.props.children}
			</div>
		);
	}
}
