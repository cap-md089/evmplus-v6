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
import './Selector.css';
import TextInput from './TextInput';
import { Identifiable } from 'common-lib';

export interface CheckInput<I, T = any> {
	displayText: string;
	filterInput: React.ComponentType<InputProps<T>>;
	check: (value: I, input: T) => boolean;
}

export interface SelectorProps<T extends Identifiable> {
	showIDField: boolean;
	returnIDs?: boolean;
	filters?: Array<CheckInput<T>>;
	displayValue: (val: T) => React.ReactChild;
	values: T[];
	onChangeVisible?: (visible: T[]) => void;
	blacklistFunction?: (value: T) => boolean;
	overflow?: number;
	filterValues?: any[];
	onFilterValuesChange?: (filterValues: any[]) => void;
}

interface SelectorPropsSingle<T extends Identifiable> extends InputProps<T>, SelectorProps<T> {
	multiple: false;
}

interface SelectorPropsMultiple<T extends Identifiable> extends InputProps<T[]>, SelectorProps<T> {
	multiple: true;
}

interface SelectorState {
	filterID: string;
	filterValues: any;
}

export type CombinedSelectorProps<T extends Identifiable> =
	| SelectorPropsSingle<T>
	| SelectorPropsMultiple<T>;

export default class Selector<T extends Identifiable> extends React.Component<
	CombinedSelectorProps<T>,
	SelectorState
> {
	public state: SelectorState = {
		filterID: '',
		filterValues: [],
	};

	public constructor(props: CombinedSelectorProps<T>) {
		super(props);

		if (typeof this.props.onInitialize !== 'undefined' && this.props.multiple) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || [],
			});
		} else if (
			typeof this.props.onInitialize !== 'undefined' &&
			!this.props.multiple &&
			typeof this.props.value !== 'undefined'
		) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || this.props,
			});
		}

		if (this.props.onChangeVisible) {
			const filterValues = (this.props.filterValues || this.state.filterValues).slice();

			const filteredValues = this.filteredIDValues.filter(val =>
				(this.props.filters || [])
					.map(({ check }, j) => check(val, filterValues[j]))
					.reduce((prev, curr) => prev && curr, true),
			);

			this.props.onChangeVisible(filteredValues);
		}

		this.state.filterValues =
			this.props.filterValues || new Array((props.filters || []).length);
	}

	public render() {
		const filterValues = this.props.filterValues || this.state.filterValues;

		const filteredValues = this.filteredIDValues.filter(val =>
			(this.props.filters || [])
				.map(({ check }, i) => check(val, filterValues[i]))
				.reduce((prev, curr) => prev && curr, true),
		);

		return (
			<div
				className="input-formbox selector-box"
				style={{
					clear: 'both',
					width: '98%',
				}}
			>
				<div className="selector-filters">
					<ul>
						{this.props.showIDField ? (
							<li>
								<div className="selector-left-filter">ID:</div>
								<div className="selector-right-filter">
									<TextInput
										name="null"
										value={this.state.filterID.toString()}
										onChange={filterID => this.setState({ filterID })}
									/>
								</div>
							</li>
						) : null}
						{(this.props.filters || []).map((value, i) => (
							<li key={i}>
								<div className="selector-left-filter">{value.displayText}</div>
								<div className="selector-right-filter">
									<value.filterInput
										value={
											typeof filterValues[i] === 'undefined'
												? ''
												: filterValues[i]
										}
										name="null"
										onChange={this.getFilterValueUpdater(i)}
										// onInitialize={this.getInitializer(i)}
									/>
								</div>
							</li>
						))}
					</ul>
				</div>
				<ul
					className="selector-values"
					style={{
						overflow: this.props.overflow ? 'auto' : 'initial',
						maxHeight: this.props.overflow,
					}}
				>
					{filteredValues.map((val, i) => (
						<li
							key={i}
							onClick={this.getSelectHandler(val)}
							className={
								(
									this.props.multiple
										? (this.props.value || [])
												.map(value => value.id)
												.indexOf(val.id) > -1
										: typeof this.props.value !== 'undefined' &&
										  this.props.value.id === val.id
								)
									? 'selected'
									: ''
							}
						>
							{this.props.displayValue(val)}
						</li>
					))}
				</ul>
			</div>
		);
	}

	private getFilterValueUpdater(i: number) {
		return (e: any) => {
			const filterValues = (this.props.filterValues || this.state.filterValues).slice();

			filterValues[i] = e;

			const filteredValues = this.filteredIDValues.filter(val =>
				(this.props.filters || [])
					.map(({ check }, j) => check(val, filterValues[j]))
					.reduce((prev, curr) => prev && curr, true),
			);

			if (filteredValues.length === 1 && this.props.onChange) {
				if (this.props.multiple) {
					this.props.onChange([...(this.props.value || []), filteredValues[0]]);
				} else {
					this.props.onChange(filteredValues[0]);
				}
			}

			if (
				typeof this.props.filterValues !== 'undefined' &&
				typeof this.props.onFilterValuesChange !== 'undefined'
			) {
				this.props.onFilterValuesChange(filterValues);
			} else {
				this.setState({ filterValues });
			}

			if (this.props.onChangeVisible) {
				this.props.onChangeVisible(filteredValues);
			}
		};
	}

	// private getInitializer(i: number) {
	// 	return ((e: {name: string, value: any}) => {
	// 		const filterValues = this.state.filterValues.slice();

	// 		filterValues[i] = e.value;

	// 		this.setState({ filterValues });

	// 		if (this.props.onChangeVisible) {
	// 			const filteredIDValues =
	// 				this.state.filterID === ''
	// 					? this.props.values.slice()
	// 					: this.props.values.filter(
	// 							val =>
	// 								!!new RegExp(
	// 									this.state.filterID,
	// 									'ig'
	// 								).exec(val.id.toString())
	// 					  );

	// 			const filteredValues = filteredIDValues.filter(val =>
	// 				(this.props.filters || [])
	// 					.map(({ check }, j) =>
	// 						check(val, this.state.filterValues[j])
	// 					)
	// 					.reduce((prev, curr) => prev && curr, true)
	// 			);

	// 			this.props.onChangeVisible(filteredValues);
	// 		}
	// 	}).bind(this);
	// }

	private getSelectHandler(val: T) {
		return (e: any) => {
			if (this.props.blacklistFunction && !this.props.blacklistFunction(val)) {
				return;
			}

			if (!this.props.multiple) {
				if (this.props.onChange) {
					this.props.onChange(val);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: val,
					});
				}

				return;
			}

			const index = (this.props.value || []).map(value => value.id).indexOf(val.id);

			if (index > -1) {
				const newList = (this.props.value || []).slice();

				newList.splice(index, 1);

				if (this.props.onChange) {
					this.props.onChange(newList);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: newList,
					});
				}
			} else {
				const newList = [...(this.props.value || []), val];

				if (this.props.onChange) {
					this.props.onChange(newList);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: newList,
					});
				}
			}
		};
	}

	private get filteredIDValues() {
		try {
			const filteredIDValues =
				this.state.filterID === ''
					? this.props.values.slice()
					: this.props.values.filter(
							val => !!new RegExp(this.state.filterID, 'ig').exec(val.id.toString()),
					  );

			return filteredIDValues;
		} catch (e) {
			return this.props.values.slice();
		}
	}
}
