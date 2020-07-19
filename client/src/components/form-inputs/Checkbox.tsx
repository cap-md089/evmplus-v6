import * as React from 'react';
import './Checkbox.scss';
import { InputProps } from './Input';

export default class Checkbox extends React.Component<InputProps<boolean>> {
	constructor(props: InputProps<boolean>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: !!this.props.value
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
						checked={!!this.props.value}
						onChange={this.onChange}
						name={this.props.name}
						id={name}
						disabled={this.props.disabled}
					/>
					<label htmlFor={name} className={this.props.disabled ? 'disabled' : ''} />
				</div>
			</div>
		);
	}

	private onChange(e: React.ChangeEvent<HTMLInputElement>) {
		if (this.props.disabled) {
			return;
		}

		const value = e.currentTarget.checked;

		this.props.onUpdate?.({
			name: this.props.name,
			value
		});

		this.props.onChange?.(value);
	}
}
