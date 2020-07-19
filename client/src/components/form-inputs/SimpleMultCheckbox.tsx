import { emptyFromLabels, SimpleMultCheckboxReturn } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './MultCheckbox.scss';

interface SimpleMultCheckboxProps extends InputProps<SimpleMultCheckboxReturn> {
	labels: string[];
}

export default class SimpleMultCheckbox extends React.Component<SimpleMultCheckboxProps> {
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

			const inputValue = this.props.value ?? emptyFromLabels(this.props.labels);
			const value = {
				...inputValue,
				values: [
					...inputValue.values.slice(0, index),
					isChecked,
					...inputValue.values.slice(index + 1)
				]
			};

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: value
				});
			}

			if (this.props.onChange) {
				this.props.onChange(value);
			}
		};
	}
}
