/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { InputProps } from './Input';

export interface SimpleRadioProps<E extends number = number> extends InputProps<E> {
	labels: string[];
	other?: boolean;
}

export default class SimpleRadioButton<E extends number = number> extends React.Component<
	SimpleRadioProps<E>
> {
	public constructor(props: SimpleRadioProps<E>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value ?? (0 as E),
			});
		}
	}

	public render(): JSX.Element {
		const index = typeof this.props.index === 'undefined' ? '' : `-${this.props.index}`;

		return (
			<div className="input-formbox" style={this.props.boxStyles}>
				<section className="radio-group-container">
					{this.props.labels.map((label, i) => {
						const checked = (i as E) === this.props.value;
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

	private getChangeHandler = (index: E) => () => {
		if (this.props.onChange) {
			this.props.onChange(index);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: index,
			});
		}
	};
}
