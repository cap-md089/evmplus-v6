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

import { emptyFromLabels, SimpleMultCheckboxReturn } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './MultCheckbox.css';

interface SimpleMultCheckboxProps extends InputProps<SimpleMultCheckboxReturn> {
	labels: string[];
}

export default class SimpleMultCheckbox extends React.Component<SimpleMultCheckboxProps> {
	public render(): JSX.Element {
		const value = this.props.value || emptyFromLabels(this.props.labels);

		const isChecked = (i: number): boolean => value.values[i];

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
								name={`${this.props.name}-${i}`}
								id={`${this.props.name}-${i}`}
								onChange={this.onCheckboxChange(i)}
							/>
							<label htmlFor={`${this.props.name}-${i}`} />
							<label htmlFor={`${this.props.name}-${i}`}>{label}</label>
						</div>
					))}
				</section>
			</div>
		);
	}

	private onCheckboxChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
		const isChecked = e.currentTarget.checked;

		const inputValue = this.props.value ?? emptyFromLabels(this.props.labels);
		const value = {
			...inputValue,
			values: [
				...inputValue.values.slice(0, index),
				isChecked,
				...inputValue.values.slice(index + 1),
			],
		};

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}

		if (this.props.onChange) {
			this.props.onChange(value);
		}
	};
}
