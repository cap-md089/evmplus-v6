import * as React from 'react';
import { InputProps } from './Input';
import './MultCheckbox.scss';
import { SimpleMultCheckboxReturn, emptyFromLabels, fromValue } from 'common-lib';

interface SimpleMultCheckboxProps extends InputProps<SimpleMultCheckboxReturn> {
	labels: string[];
}

export default class SimpleMultCheckbox extends React.Component<SimpleMultCheckboxProps> {
	constructor(props: SimpleMultCheckboxProps) {
		super(props);
	}

	public render() {
		const value = this.props.value || emptyFromLabels(this.props.labels);

		const isChecked = (i: number) => value.values[i];

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<section>
					{this.props.hasError && this.props.errorMessage ? (
						<div style={{ paddingBottom: 5 }} className="text-error">
							{this.props.errorMessage}
						</div>
					) : null}
					{this.props.labels.map((label, i) => (
						<div className="checkboxDiv checkboxDivMult" key={i}>
							<input
								type="checkbox"
								checked={isChecked(i)}
								name={this.props.name + '-' + i}
								id={this.props.name + '-' + i}
								onChange={this.onCheckboxChange(i)}
							/>
							<label htmlFor={this.props.name + '-' + i} />
							<label htmlFor={this.props.name + '-' + i}>{label}</label>
						</div>
					))}
				</section>
			</div>
		);
	}

	private onCheckboxChange(index: number) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const isChecked = e.currentTarget.checked;

			const value = fromValue(this.props.value)
				.orElse(emptyFromLabels(this.props.labels))
				.map(val => ({
					...val,
					values: [
						...val.values.slice(0, index),
						isChecked,
						...val.values.slice(index + 1)
					]
				}));

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: value.some()
				});
			}

			if (this.props.onChange) {
				this.props.onChange(value.some());
			}
		};
	}
}
