import * as React from 'react';
import { InputProps } from './Input';

interface MultCheckboxProps
	extends InputProps<[boolean[], string | undefined]> {
	labels: string[];
	other?: boolean;
}

export default class MultCheckbox extends React.Component<
	MultCheckboxProps,
	{
		currentText: string;
		currentValue: boolean[];
	}
> {
	constructor(props: MultCheckboxProps) {
		super(props);

		const arrFromLength = (len: number): boolean[] =>
			len <= 1 ? [false] : [false, ...arrFromLength(len - 1)];

		if (typeof props.value === 'undefined') {
			this.state = {
				currentValue: arrFromLength(
					this.props.labels.length + (this.props.other ? 1 : 0)
				),
				currentText: ''
			};
		} else {
			this.state = {
				currentValue:
					typeof props.value[0] === 'undefined'
						? arrFromLength(
								this.props.labels.length +
									(this.props.other ? 1 : 0)
						  )
						: props.value[0],
				currentText:
					typeof props.value[1] === 'undefined' ? '' : props.value[1]!
			};
		}

		if (this.props.onUpdate) {
			const value = [
				this.state.currentValue,
				this.state.currentValue[this.props.labels.length] ? this.state.currentText : undefined
			];
			this.props.onUpdate({
				name: this.props.name,
				value: value as [boolean[], string | undefined]
			});
		}
		
		this.addOther = this.addOther.bind(this);
		this.updateText = this.updateText.bind(this);
	}

	public render() {
		return (
			<div className="formbox">
				<section>
					{this.props.labels.map((label, i) => (
						<div className="checkboxDiv checkboxDivMult" key={i}>
							<input
								type="checkbox"
								checked={this.state.currentValue[i]}
								name={this.props.name + '-' + i}
								id={this.props.name + '-' + i}
								onChange={this.onCheckboxChange(i)}
							/>
							<label htmlFor={this.props.name + '-' + i} />
							<label htmlFor={this.props.name + '-' + i}>
								{label}
							</label>
						</div>
					))}
					{this.props.other ? (
						<div className="checkboxDiv checkboxDivMult">
							<input
								type="checkbox"
								checked={
									this.state.currentValue[
										this.props.labels.length
									]
								}
								name={this.props.name + '-Other'}
								id={this.props.name + '-Other'}
								onChange={this.onCheckboxChange(
									this.props.labels.length
								)}
							/>
							<label htmlFor={this.props.name + '-Other'} />
							<label htmlFor={this.props.name + '-Other'}>
								Other:
								<input
									type="text"
									value={this.state.currentText}
									className="otherInput"
									onFocus={this.addOther}
									onChange={this.updateText}
								/>
							</label>
						</div>
					) : null}
				</section>
			</div>
		);
	}

	private onCheckboxChange(index: number) {
		return ((e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.currentTarget.checked;

			const currentValues = this.state.currentValue.slice(0);

			currentValues[index] = value;

			this.setState({
				currentValue: currentValues
			});

			const stringValue = currentValues[this.props.labels.length] ? this.state.currentText : undefined;

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: [currentValues, stringValue]
				})
			}

			if (this.props.onChange) {
				this.props.onChange([currentValues, stringValue]);
			}
		}).bind(this);
	}

	private addOther() {
		const values = this.state.currentValue.slice(0);

		values[this.props.labels.length] = true;

		this.setState({
			currentValue: values
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: [values, this.state.currentText]
			});
		}

		if (this.props.onChange) {
			this.props.onChange([values, this.state.currentText]);
		}
	}

	private updateText (e: React.ChangeEvent<HTMLInputElement>) {
		this.setState({
			currentText: e.currentTarget.value
		});

		const values = this.state.currentValue.slice(0);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: [values, this.state.currentText]
			});
		}

		if (this.props.onChange) {
			this.props.onChange([values, this.state.currentText]);
		}
	}
}
