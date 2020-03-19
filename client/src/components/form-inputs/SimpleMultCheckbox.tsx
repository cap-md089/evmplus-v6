import * as React from 'react';
import { InputProps } from './Input';
import './MultCheckbox.scss';
import { SimpleMultCheckboxReturn, emptyFromLabels, Maybe, none } from 'common-lib';

interface SimpleMultCheckboxProps extends InputProps<Maybe<SimpleMultCheckboxReturn>> {
	labels: string[];
}

export default class SimpleMultCheckbox extends React.Component<SimpleMultCheckboxProps> {
	constructor(props: SimpleMultCheckboxProps) {
		super(props);
	}

	public render() {
		const value = this.props.value || none();

		const isChecked = (i: number) =>
			value
				.map(val => val.values[i])
				.orElse(false)
				.some();

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<section>
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

			const value = (this.props.value || none())
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
					value
				});
			}

			if (this.props.onChange) {
				this.props.onChange(value);
			}
		};
	}
}
