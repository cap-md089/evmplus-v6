import * as React from 'react';

import { InputProps } from './Input';

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

	password?: boolean;
}

/**
 * A text input that can be used by a Form
 */
export default class TextInput extends React.Component<TextInputProps, { changed: boolean }> {
	public state: { changed: boolean } = {
		changed: false
	};

	constructor(props: TextInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.onInitialize) {
			props.onInitialize({
				name: props.name,
				value: props.value || ''
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
					value: text
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
				className="formbox"
				style={{
					clear: this.props.fullWidth ? 'both' : undefined,
					width: this.props.fullWidth ? '90%' : undefined,
					...this.props.boxStyles
				}}
			>
				<input
					type={this.props.password ? 'password' : 'text'}
					value={this.props.value}
					onChange={this.onChange}
					name={this.props.name}
					style={{
						width: this.props.fullWidth ? '100%' : undefined,
						...this.props.inputStyles
					}}
					placeholder={this.props.placeholder}
					disabled={this.props.disabled}
				/>
				{this.props.hasError && this.props.errorMessage && this.state.changed ? (
					<span>{this.props.errorMessage}</span>
				) : null}
			</div>
		);
	}
}
