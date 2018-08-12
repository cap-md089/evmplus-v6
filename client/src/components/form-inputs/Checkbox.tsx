import * as React from 'react';
import { InputProps } from './Input';

interface CheckboxProps extends InputProps<boolean> {}

interface CheckboxState {
	value: boolean;
}

export default class Checkbox extends React.Component<CheckboxProps, CheckboxState> {
	public state = {
		value: false
	};

	constructor(props: CheckboxProps) {
		super(props);

		this.onChange = this.onChange.bind(this);
		
		this.state = {
			value: typeof props.value === 'undefined' ? false : props.value
		};

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: this.state.value
			});
		}
	}

	public render () {
		return (
			<div className="formbox" style={this.props.boxStyles}>
				<div className="checkboxDiv">
					<input
						type="checkbox"
						checked={this.state.value}
						onChange={this.onChange}
						name={this.props.name}
						id={this.props.name}
					/>
					<label htmlFor={this.props.name} />
				</div>
			</div>
		);
	}

	private onChange (e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.currentTarget.checked;
		this.setState({
			value
		});

		if (this.props.onChange) {
			this.props.onChange(value)
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}
	}
}