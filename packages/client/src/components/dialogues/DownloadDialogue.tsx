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

import { Identifiable } from 'common-lib';
import * as React from 'react';
import Selector, { Filters } from '../form-inputs/Selector';
import Dialogue, { DialogueButtons } from './Dialogue';

interface DownloadProps<T extends Identifiable, FilterValues extends any[]> {
	valuePromise: Promise<T[]> | T[];
	// Properties for the dialogue
	open: boolean;
	title: string;
	onCancel: () => void;

	// Properties for the selector
	showIDField?: boolean;
	filters: Filters<T, FilterValues>;
	onChangeVisible?: (visible: T[]) => void;
	overflow?: number;
	filterValues: FilterValues;
	onFilterValuesChange?: (filterValues: FilterValues) => void;
	displayValue: (value: T) => React.ReactChild;
	valueFilter?: (value: T) => boolean;
}

interface DownloadPropsSingle<T extends Identifiable, FilterValues extends any[]>
	extends DownloadProps<T, FilterValues> {
	multiple: false;
	onValueClick: (value: T | null) => void;
	onValueSelect: (value: T | null) => void;
	selectedValue?: T | null;
}

interface DownloadPropsMultiple<T extends Identifiable, FilterValues extends any[]>
	extends DownloadProps<T, FilterValues> {
	multiple: true;
	onValuesClick: (values: T[]) => void;
	onValuesSelect: (values: T[]) => void;
	selectedValues?: T[];
}

type DownloadDialogueProps<T extends Identifiable, FilterValues extends any[]> =
	| DownloadPropsMultiple<T, FilterValues>
	| DownloadPropsSingle<T, FilterValues>;

interface DownloadDialogueState<T> {
	values: T[] | null;
	selectedValues: T[];
}

export default class DownloadDialogue<
	T extends Identifiable,
	FilterValues extends any[] = any[]
> extends React.Component<DownloadDialogueProps<T, FilterValues>, DownloadDialogueState<T>> {
	public state: DownloadDialogueState<T> = {
		values: null,
		selectedValues: [],
	};

	public async componentDidMount(): Promise<void> {
		if (this.props.valuePromise instanceof Promise) {
			await this.props.valuePromise.then(values => this.setState({ values }));
		} else {
			this.setState({
				values: this.props.valuePromise,
			});
		}
	}

	public render(): JSX.Element | null {
		if (this.state.values === null) {
			return null;
		}

		let selector;
		const selectorProps = {
			name: 'selector',
			showIDField: !!this.props.showIDField,
			displayValue: this.props.displayValue,
			values: this.state.values,
			filters: this.props.filters,
			filterValues: this.props.filterValues,
			overflow: this.props.overflow,
			onFilterValuesChange: this.props.onFilterValuesChange,
		};

		if (this.props.multiple) {
			selector = (
				<Selector<T, FilterValues>
					{...selectorProps}
					multiple={true}
					value={this.props.selectedValues || this.state.selectedValues}
					onChange={this.onMultipleChange}
				/>
			);
		} else {
			selector = (
				<Selector<T, FilterValues>
					{...selectorProps}
					multiple={false}
					value={this.props.selectedValue || this.state.selectedValues[0]}
					onChange={this.onSingleChange}
				/>
			);
		}

		return (
			<Dialogue
				open={this.props.open && this.state.values !== null}
				displayButtons={DialogueButtons.OK_CANCEL}
				labels={['Select', 'Cancel']}
				title={this.props.title}
				onClose={() => void 0}
				onOk={this.onOk}
				onCancel={this.onCancel}
			>
				{selector}
			</Dialogue>
		);
	}

	protected hasValue(value: T): boolean {
		let ret = false;

		if (this.props.multiple) {
			(this.props.selectedValues || []).forEach(selected => {
				if (value.id === selected.id) {
					ret = true;
				}
			});
		} else {
			ret = !!this.props.selectedValue && this.props.selectedValue.id === value.id;
		}

		return ret;
	}

	private onOk = (): void => {
		if (this.props.multiple) {
			if (!this.state.values) {
				return;
			}
			this.props.onValuesSelect(this.state.values.filter(val => this.hasValue(val)));
		} else {
			this.props.onValueSelect(this.props.selectedValue ? this.props.selectedValue : null);
		}
	};

	private onCancel = (): void => {
		this.props.onCancel();
	};

	private onSingleChange = (value: T): void => {
		this.onChange([value]);

		if (!this.props.multiple) {
			this.props.onValueClick(value);
		}
	};

	private onMultipleChange = (values: T[]): void => {
		this.onChange(values);

		if (this.props.multiple) {
			this.props.onValuesClick(values);
		}
	};

	private onChange = (selectedValues: T[]): void => {
		this.setState({
			selectedValues,
		});
	};
}
