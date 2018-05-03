import * as React from 'react';

import { InputProps } from './Input';

interface TextInputProps extends InputProps<string> {
	fullWidth?: boolean;
	placeholder?: string;
}

/**
 * A text input that can be used by a Form
 */
export default class TextInput extends React.Component<TextInputProps, {
	value: string
}> {
	public state = {
		value: ''
	};
	
	constructor(props: InputProps<string>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.value) {
			this.state = {
				value: props.value
			};
		}
	}

	public onChange (e: React.FormEvent<HTMLInputElement>) {
		let text = e.currentTarget.value;

		this.setState({
			value: text
		});

		if (typeof this.props.onChange !== 'undefined') {
			this.props.onChange(e, text);
		}

		if (typeof this.props.onUpdate !== 'undefined') {
			this.props.onUpdate({
				name: this.props.name,
				value: text
			});
		}
	}

	render() {
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
					type="text"
					value={this.state.value}
					onChange={this.onChange}
					name={this.props.name}
					style={{
						width: this.props.fullWidth ? '100%' : undefined,
						...this.props.inputStyles
					}}
					placeholder={this.props.placeholder}
				/>
			</div>
		);
	}
}