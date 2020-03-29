import { OtherMultCheckboxReturn, fromValue, just, none, emptyFromLabels } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './MultCheckbox.scss';

interface OtherMultCheckboxProps extends InputProps<OtherMultCheckboxReturn> {
	labels: string[];
}

export default class OtherMultCheckbox extends React.Component<OtherMultCheckboxProps> {
	constructor(props: OtherMultCheckboxProps) {
		super(props);

		this.addOther = this.addOther.bind(this);
		this.updateText = this.updateText.bind(this);
		this.onOtherCheckboxChange = this.onOtherCheckboxChange.bind(this);
	}

	public render() {
		const value = fromValue(this.props.value);

		const isChecked = (i: number) =>
			value
				.flatMap(val => fromValue(val.values[i]))
				.orElse(false)
				.some();

		const isOtherChecked = value
			.map(val => val.otherSelected)
			.orElse(false)
			.some();

		const otherText = value
			.flatMap(val => (val.otherSelected ? just(val.otherValue) : none<string>()))
			.orElse('')
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
					<div className="checkboxDiv checkboxDivMult">
						<input
							type="checkbox"
							checked={isOtherChecked}
							name={this.props.name + '-Other'}
							id={this.props.name + '-Other'}
							onChange={this.onOtherCheckboxChange}
						/>
						<label htmlFor={this.props.name + '-Other'} />
						<label htmlFor={this.props.name + '-Other'}>
							Other:
							<input
								type="text"
								value={otherText}
								className="otherInput"
								onFocus={this.addOther}
								onChange={this.updateText}
							/>
						</label>
					</div>
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
				}))
				.some();

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

	private addOther() {
		const value = fromValue(this.props.value)
			.orElse(emptyFromLabels(this.props.labels))
			.map(val => ({
				...val,
				otherSelected: true,
				otherValue: val.otherSelected ? val.otherValue : ''
			}))
			.some();

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

	private onOtherCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
		const isChecked = e.currentTarget.checked;

		const value = fromValue(this.props.value)
			.orElse(emptyFromLabels(this.props.labels))
			.map<OtherMultCheckboxReturn>(val =>
				isChecked
					? {
							...val,
							otherSelected: true,
							otherValue: e.currentTarget.value
					  }
					: {
							...val,
							otherSelected: false
					  }
			)
			.some();

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

	private updateText(e: React.ChangeEvent<HTMLInputElement>) {
		const value = fromValue(this.props.value)
			.orElse(emptyFromLabels(this.props.labels))
			.map(val => ({
				...val,
				otherSelected: true,
				otherValue: e.currentTarget.value
			}))
			.some();

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
