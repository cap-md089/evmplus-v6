/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { get, Maybe as M, pipe, RadioReturnWithOther } from 'common-lib';
import * as React from 'react';
import { InputProps } from './Input';
import './RadioButton.css';

export interface RadioProps<E extends number = number> extends InputProps<RadioReturnWithOther<E>> {
	labels: string[];
}

export default class RadioButton<E extends number = number> extends React.Component<RadioProps<E>> {
	public constructor(props: RadioProps<E>) {
		super(props);

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.props.value || {
					labels: this.props.labels.slice(),
					otherValueSelected: false,
					selection: 0 as E,
				},
			});
		}
	}

	public render(): JSX.Element {
		const value = M.fromValue(this.props.value);

		const isChecked = (i: number): boolean =>
			pipe(
				M.map<RadioReturnWithOther<E>, boolean>(ret =>
					ret.otherValueSelected ? false : ret.selection === i,
				),
				M.orSome(false),
			)(value);

		const name = (i: number): string =>
			`${this.props.name}-${
				this.props.index === undefined ? '' : `-${this.props.index}`
			}-${i}`;

		const isOtherChecked = pipe(
			M.map<RadioReturnWithOther<E>, boolean>(get('otherValueSelected')),
			M.orSome(false),
		)(value);

		const otherText = pipe(
			M.flatMap<RadioReturnWithOther<E>, string>(ret =>
				ret.otherValueSelected ? M.some(ret.otherValue) : M.none(),
			),
			M.orSome(''),
		)(value);

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
							id={`${this.props.name}-${this.props.labels.length}`}
							type="radio"
							value={this.props.labels.length}
							onChange={this.selectOther}
							checked={isOtherChecked}
						/>
						<label htmlFor={`${this.props.name}-${this.props.labels.length}`}>
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
							htmlFor={`${this.props.name}-${this.props.labels.length}`}
							className="check"
						/>
					</div>
				</section>
			</div>
		);
	}

	private getChangeHandler = (index: E) => () => {
		const value = {
			labels: this.props.labels,
			otherValueSelected: false as const,
			selection: index,
		};

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}
	};

	private updateOtherText = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const text = e.target.value;

		const value = {
			labels: this.props.labels,
			otherValueSelected: true as const,
			otherValue: text,
		};

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}
	};

	private selectOther = (): void => {
		const otherText = pipe(
			M.flatMap<RadioReturnWithOther<E>, string>(ret =>
				ret.otherValueSelected ? M.some(ret.otherValue) : M.none(),
			),
			M.orSome(''),
		)(M.fromValue(this.props.value));

		const value = {
			labels: this.props.labels,
			otherValue: otherText,
			otherValueSelected: true as const,
		};

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}
	};
}
