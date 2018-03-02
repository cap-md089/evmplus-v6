import * as React from 'react';

import { InputProps, InputState } from './Input';

/**
 * A text input that can be used by a Form
 */
export default class TextInput extends React.Component<InputProps<string>, InputState> {
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
			this.props.onUpdate(e);
		}
	}

	render() {
		return (
			<div
				className="formbox"
				style={this.props.boxStyles}
			>
				<input
					type="text"
					value={this.state.value}
					onChange={this.onChange}
					name={this.props.name}
					style={this.props.inputStyles}
				/>
			</div>
		);
	}
}