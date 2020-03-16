import * as React from 'react';
import { InputProps } from './Input';
import './Checkbox.scss';

interface CheckboxState {
	value: boolean;
}

export default class Checkbox extends React.Component<InputProps<boolean>, CheckboxState> {
	public state = {
		value: false
	};

	constructor(props: InputProps<boolean>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		this.state = {
			value:
				typeof props.value === 'undefined' || (props.value as any) === ''
					? false
					: props.value
		};

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: this.state.value
			});
		}
	}

	public render() {
		const name = !!this.props.index
			? `${this.props.name}-${this.props.index}`
			: this.props.name;

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<div className="checkboxDiv">
					<input
						type="checkbox"
						checked={this.state.value}
						onChange={this.onChange}
						name={this.props.name}
						id={name}
					/>
					<label htmlFor={name} />
				</div>
			</div>
		);
	}

	private onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.currentTarget.checked;
		this.setState({
			value
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}

		if (this.props.onChange) {
			this.props.onChange(value);
		}
	}
}
