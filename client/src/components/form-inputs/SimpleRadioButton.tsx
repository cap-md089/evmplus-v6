import * as React from 'react';
import { InputProps } from './Input';
import { Maybe, none, just } from 'common-lib';

export interface SimpleRadioProps<E extends number = number> extends InputProps<Maybe<E>> {
	labels: string[];
	other?: boolean;
}

export default class SimpleRadioButton<E extends number = number> extends React.Component<
	SimpleRadioProps<E>
> {
	constructor(props: SimpleRadioProps<E>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || none()
			});
		}
	}

	public render() {
		const index = typeof this.props.index === 'undefined' ? '' : '-' + this.props.index;

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<section className="radio-group-container">
					{this.props.labels.map((label, i) => {
						const checked = (i as E) === (this.props.value || none()).orSome(-1 as E);
						return (
							<div className="radio-button-container" key={i}>
								<input
									id={`${this.props.name}-${i}${index}`}
									type="radio"
									value={i}
									onChange={this.getChangeHandler(i as E)}
									checked={checked}
								/>
								<label htmlFor={`${this.props.name}-${i}${index}`}>{label}</label>
								<label
									htmlFor={`${this.props.name}-${i}${index}`}
									className="check"
								/>
							</div>
						);
					})}
				</section>
			</div>
		);
	}

	private getChangeHandler(index: E) {
		return () => {
			if (this.props.onChange) {
				this.props.onChange(just(index));
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: just(index)
				});
			}
		};
	}
}
