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
import { TextInputProps } from './TextInput';
import './BigTextBox.scss';

export default class BigTextBox extends React.Component<TextInputProps> {
	constructor(props: TextInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.onInitialize) {
			props.onInitialize({
				name: props.name,
				value: props.value || '',
			});
		}
	}

	public render() {
		return (
			<div
				className="input-formbox"
				style={{
					clear: this.props.fullWidth ? 'both' : undefined,
					width: this.props.fullWidth ? '90%' : undefined,
					...this.props.boxStyles,
				}}
			>
				<textarea
					onChange={this.onChange}
					value={this.props.value}
					style={{
						resize: 'none',
						width: this.props.fullWidth ? '100%' : undefined,
						...this.props.inputStyles,
					}}
					cols={50}
					rows={5}
					placeholder={this.props.placeholder}
					disabled={this.props.disabled}
				/>
			</div>
		);
	}

	private onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const text = e.currentTarget.value;

		let change = true;

		if (typeof this.props.shouldUpdate !== 'undefined') {
			const newChange = this.props.shouldUpdate(text);
			change = newChange;
		}

		if (change) {
			if (typeof this.props.onUpdate !== 'undefined') {
				this.props.onUpdate({
					name: this.props.name,
					value: text,
				});
			}

			if (typeof this.props.onChange !== 'undefined') {
				this.props.onChange(text);
			}
		}
	}
}
