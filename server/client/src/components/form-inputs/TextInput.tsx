import * as React from 'react';

interface Input {
	onChange: (e: React.FormEvent<HTMLInputElement>) => void;
}

export default class TextInput extends React.Component<Input, {}> {
	public IsInput: boolean = true;
	
	constructor(props: Input) {
		super(props);
	}

	render() {
		return (
			<div className="formbox">
				<input onChange={this.props.onChange} />
			</div>
		);
	}
}