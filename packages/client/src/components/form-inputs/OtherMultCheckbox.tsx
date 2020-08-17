/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { emptyFromLabels, get, Maybe as M, OtherMultCheckboxReturn, pipe } from 'common-lib';
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
		const value = M.fromValue(this.props.value);

		const isChecked = (i: number) =>
			pipe(
				M.flatMap<OtherMultCheckboxReturn, boolean>(ret =>
					ret.otherSelected ? M.some(false) : M.fromValue(ret.values[i]),
				),
				M.orSome(false),
			)(value);

		const isOtherChecked = pipe(
			M.map<OtherMultCheckboxReturn, boolean>(get('otherSelected')),
			M.orSome(false),
		)(value);

		const otherText = pipe(
			M.flatMap<OtherMultCheckboxReturn, string>(ret =>
				ret.otherSelected ? M.some(ret.otherValue) : M.none(),
			),
			M.orSome(''),
		)(value);

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

	private addOther() {
		const inputValue = this.props.value ?? emptyFromLabels(this.props.labels);
		const value = {
			...inputValue,
			otherSelected: true,
			otherValue: inputValue.otherSelected ? inputValue.otherValue : '',
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
	}

	private onOtherCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
		const isChecked = e.currentTarget.checked;

		const inputValue = this.props.value ?? emptyFromLabels(this.props.labels);
		const value: OtherMultCheckboxReturn = isChecked
			? {
					...inputValue,
					otherSelected: true,
					otherValue: inputValue.otherSelected ? inputValue.otherValue : '',
			  }
			: {
					...inputValue,
					otherSelected: false,
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
	}

	private updateText(e: React.ChangeEvent<HTMLInputElement>) {
		const inputValue = this.props.value ?? emptyFromLabels(this.props.labels);
		const value = {
			...inputValue,
			otherSelected: true,
			otherValue: inputValue.otherSelected ? e.currentTarget.value : '',
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
	}
}
