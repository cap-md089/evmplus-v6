import { Maybe, RadioReturnWithOther, none, just } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './RadioButton.scss';

export interface RadioProps<E extends number = number>
	extends InputProps<Maybe<RadioReturnWithOther<E>>> {
	labels: string[];
}

export default class RadioButton<E extends number = number> extends React.Component<RadioProps<E>> {
	constructor(props: RadioProps<E>) {
		super(props);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.props.value || none()
			});
		}

		this.updateOtherText = this.updateOtherText.bind(this);
		this.selectOther = this.selectOther.bind(this);
	}

	public render() {
		const value = this.props.value || none();

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
			const value = just<RadioReturnWithOther<E>>({
				labels: this.props.labels,
				otherValueSelected: false,
				selection: index
			});

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

		const value = just<RadioReturnWithOther<E>>({
			labels: this.props.labels,
			otherValueSelected: true,
			otherValue: text
		});

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
		const otherText = (this.props.value || none())
			.flatMap(ret => (ret.otherValueSelected ? just(ret.otherValue) : none<string>()))
			.orElse('')
			.some();

		const value = just<RadioReturnWithOther<E>>({
			labels: this.props.labels,
			otherValue: otherText,
			otherValueSelected: true
		});

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
