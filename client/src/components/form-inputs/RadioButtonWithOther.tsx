import { Maybe, RadioReturnWithOther, none, just, emptyFromLabels, fromValue } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './RadioButton.scss';

export interface RadioProps<E extends number = number> extends InputProps<RadioReturnWithOther<E>> {
	labels: string[];
}

export default class RadioButton<E extends number = number> extends React.Component<RadioProps<E>> {
	constructor(props: RadioProps<E>) {
		super(props);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.props.value || {
					labels: this.props.labels.slice(),
					otherValueSelected: false,
					selection: 0 as E
				}
			});
		}

		this.updateOtherText = this.updateOtherText.bind(this);
		this.selectOther = this.selectOther.bind(this);
	}

	public render() {
		const value = fromValue(this.props.value);

		const isChecked = (i: number) =>
			value
				.map(ret => (ret.otherValueSelected ? false : ret.selection === i))
				.orElse(false)
				.some();

		const name = (i: number) =>
			`${this.props.name}-${
				this.props.index === undefined ? '' : `-${this.props.index}`
			}-${i}`;

		const isOtherChecked = value
			.map(ret => ret.otherValueSelected)
			.orElse(false)
			.some();

		const otherText = value
			.flatMap(ret => (ret.otherValueSelected ? just(ret.otherValue) : none<string>()))
			.orElse('')
			.some();

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<section className="radio-group-container">
					{this.props.labels.map((label, i) => (
						<div className="radio-button-container" key={i}>
							<input
								id={name(i)}
								type="radio"
								value={i}
								onChange={this.getChangeHandler(i as E)}
								checked={isChecked(i)}
							/>
							<label htmlFor={name(i)}>{label}</label>
							<label htmlFor={name(i)} className="check" />
						</div>
					))}
					<div className="radio-button-container">
						<input
							id={this.props.name + '-' + this.props.labels.length}
							type="radio"
							value={this.props.labels.length}
							onChange={this.selectOther}
							checked={isOtherChecked}
						/>
						<label htmlFor={this.props.name + '-' + this.props.labels.length}>
							Other:
							<input
								id={this.props.name + 'Other'}
								value={otherText}
								className="otherRadioInput otherInput"
								onChange={this.updateOtherText}
								onClick={this.selectOther}
								onFocus={this.selectOther}
								type="text"
							/>
						</label>
						<label
							htmlFor={this.props.name + '-' + this.props.labels.length}
							className="check"
						/>
					</div>
				</section>
			</div>
		);
	}

	private getChangeHandler(index: E) {
		return () => {
			const value = {
				labels: this.props.labels,
				otherValueSelected: false as const,
				selection: index
			};

			if (this.props.onChange) {
				this.props.onChange(value);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value
				});
			}
		};
	}

	private updateOtherText(e: React.ChangeEvent<HTMLInputElement>) {
		const text = e.target.value;

		const value = {
			labels: this.props.labels,
			otherValueSelected: true as const,
			otherValue: text
		};

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}
	}

	private selectOther() {
		const otherText = fromValue(this.props.value)
			.flatMap(ret => (ret.otherValueSelected ? just(ret.otherValue) : none<string>()))
			.orElse('')
			.some();

		const value = {
			labels: this.props.labels,
			otherValue: otherText,
			otherValueSelected: true as const
		};

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}
	}
}
