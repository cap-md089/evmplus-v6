import * as React from 'react';
import { InputProps } from './Input';

export interface RadioProps<E extends number = number>
	extends InputProps<[E, string | undefined]> {
	labels: string[];
	other?: boolean;
}

export default class RadioButton<
	E extends number = number
> extends React.Component<
	RadioProps<E | -1>,
	{ currentChecked: number; otherText: string }
> {
	public state = {
		currentChecked:
			this.props.value && typeof this.props.value[0] !== 'undefined'
				? this.props.value[0]
				: -1,
		otherText:
			this.props.value && !!this.props.value[1]
				? this.props.value[1]!
				: ''
	};

	constructor(props: RadioProps<E | -1>) {
		super(props);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.props.value || [-1, undefined]
			});
		}

		this.updateOtherText = this.updateOtherText.bind(this);
		this.selectOther = this.selectOther.bind(this);
	}

	public render() {
		return (
			<div className="formbox">
				<section className="radioDiv">
					{this.props.labels.map((label, i) => (
						<div className="roundedTwo" key={i}>
							<input
								id={`${this.props.name}-${i}`}
								type="radio"
								value={i}
								onChange={this.getChangeHandler(i)}
								checked={i === this.state.currentChecked}
							/>
							<label htmlFor={`${this.props.name}-${i}`}>
								{label}
							</label>
							<label
								htmlFor={`${this.props.name}-${i}`}
								className="check"
							/>
						</div>
					))}
					{this.props.other ? (
						<div className="roundedTwo">
							<input
								id={
									this.props.name +
									'-' +
									this.props.labels.length
								}
								type="radio"
								value={this.props.labels.length}
								onChange={this.getChangeHandler(
									this.props.labels.length
								)}
								checked={
									this.props.labels.length ===
									this.state.currentChecked
								}
							/>
							<label
								htmlFor={
									this.props.name +
									'-' +
									this.props.labels.length
								}
							>
								Other:
								<input
									id={this.props.name + 'Other'}
									value={this.state.otherText}
									className="otherRadioInput otherInput"
									onChange={this.updateOtherText}
									onClick={this.selectOther}
									onFocus={this.selectOther}
									type="text"
								/>
							</label>
							<label
								htmlFor={
									this.props.name +
									'-' +
									this.props.labels.length
								}
								className="check"
							/>
						</div>
					) : null}
				</section>
			</div>
		);
	}

	private getChangeHandler(index: number) {
		return (() => {
			this.setState({
				currentChecked: index
			});

			if (this.props.onChange) {
				this.props.onChange([
					index as E,
					index === this.props.labels.length
						? this.state.otherText
						: undefined
				]);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: [
						index as E,
						index === this.props.labels.length
							? this.state.otherText
							: undefined
					]
				});
			}
		}).bind(this);
	}

	private updateOtherText(e: React.ChangeEvent<HTMLInputElement>) {
		const text = e.target.value;

		this.setState({
			otherText: text,
			currentChecked: this.props.labels.length
		});

		if (this.props.onChange) {
			this.props.onChange([this.props.labels.length as E, text]);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: [this.props.labels.length as E, text]
			});
		}
	}

	private selectOther() {
		const currentChecked = this.props.labels.length;
		const otherText = this.state.otherText;
		this.setState({
			currentChecked
		});

		if (this.props.onChange) {
			this.props.onChange([this.props.labels.length as E, otherText]);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: [this.props.labels.length as E, otherText]
			});
		}
	}
}
