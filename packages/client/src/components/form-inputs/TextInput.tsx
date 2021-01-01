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
import './TextInput.scss';

export interface TextInputProps extends InputProps<string> {
	/**
	 * Called when the text is changed
	 *
	 * If it returns a boolean, it changes whether or not the change is accepted
	 */
	onChange?: (val: string) => void;
	fullWidth?: boolean;
	placeholder?: string;
	disabled?: boolean;
	shouldUpdate?: (val: string) => boolean;

	showSuggestions?: boolean;

	password?: boolean;
}

interface InnerTextInputProps extends TextInputProps {
	innerRef: React.Ref<HTMLInputElement>;
}

/**
 * A text input that can be used by a Form
 */
export class TextInput extends React.Component<InnerTextInputProps, { changed: boolean }> {
	public state: { changed: boolean } = {
		changed: false,
	};

	constructor(props: InnerTextInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.onInitialize) {
			props.onInitialize({
				name: props.name,
				value: props.value || '',
			});
		}
	}

	public onChange(e: React.FormEvent<HTMLInputElement>) {
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

			this.setState({ changed: true });
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
				<input
					type={this.props.password ? 'password' : 'text'}
					value={this.props.value}
					onChange={this.onChange}
					name={this.props.name}
					style={{
						width: this.props.fullWidth ? '100%' : undefined,
						...this.props.inputStyles,
					}}
					placeholder={this.props.placeholder}
					disabled={this.props.disabled}
					autoComplete={this.props.showSuggestions ?? true ? 'on' : 'off'}
				/>
				{this.props.hasError && this.props.errorMessage && this.state.changed ? (
					<span className="text-error">{this.props.errorMessage}</span>
				) : null}
			</div>
		);
	}
}

export default React.forwardRef<HTMLInputElement, TextInputProps>((props, ref) => (
	<TextInput {...props} innerRef={ref} />
));
