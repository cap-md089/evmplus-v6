import * as React from 'react';

interface Input {
	onChange: (e?: React.FormEvent<HTMLInputElement>, str?: string) => void;
	name: string;
}

interface InputState {
	value: string;
}

export default class TextInput extends React.Component<Input, InputState> {
	public IsInput: boolean = true;

	public state = {
		value: ''
	};
	
	constructor(props: Input) {
		super(props);

		this.onChange = this.onChange.bind(this);

		this.IsInput = true;
	}

	public onChange (e: React.FormEvent<HTMLInputElement>) {
		let text = e.currentTarget.value;

		this.setState({
			value: text
		});

		this.props.onChange(e, text);
	}

	public getName (): string {
		return this.props.name;
	}

	public getValue (): string {
		return this.state.value;
	}

	render() {
		return (
			<div className="formbox">
				<input value={this.state.value} onChange={this.onChange} />
			</div>
		);
	}
}