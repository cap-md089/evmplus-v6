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
import Dialogue, { DialogueButtons } from './Dialogue';
import Selector, { CheckInput } from '../form-inputs/Selector';
import { Identifiable } from 'common-lib';

interface DownloadProps<T extends Identifiable> {
	valuePromise: Promise<T[]> | T[];
	// Properties for the dialogue
	open: boolean;
	title: string;
	onCancel: () => void;

	// Properties for the selector
	showIDField?: boolean;
	filters?: Array<CheckInput<T>>;
	onChangeVisible?: (visible: T[]) => void;
	overflow?: number;
	filterValues?: any[];
	onFilterValuesChange?: (filterValues: any[]) => void;
	displayValue: (value: T) => React.ReactChild;
	valueFilter?: (value: T) => boolean;
}

interface DownloadPropsSingle<T extends Identifiable> extends DownloadProps<T> {
	multiple: false;
	onValueClick: (value: T | null) => void;
	onValueSelect: (value: T | null) => void;
	selectedValue?: T | null;
}

interface DownloadPropsMultiple<T extends Identifiable> extends DownloadProps<T> {
	multiple: true;
	onValuesClick: (values: T[]) => void;
	onValuesSelect: (values: T[]) => void;
	selectedValues?: T[];
}

type DownloadDialogueProps<T extends Identifiable> =
	| DownloadPropsMultiple<T>
	| DownloadPropsSingle<T>;

interface DownloadDialogueState<T> {
	values: T[] | null;
	selectedValues: T[];
}

export default class DownloadDialogue<T extends Identifiable> extends React.Component<
	DownloadDialogueProps<T>,
	DownloadDialogueState<T>
> {
	public state: DownloadDialogueState<T> = {
		values: null,
		selectedValues: [],
	};

	constructor(props: DownloadDialogueProps<T>) {
		super(props);

		this.onOk = this.onOk.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onSingleChange = this.onSingleChange.bind(this);
		this.onMultipleChange = this.onMultipleChange.bind(this);
	}

	public componentDidMount() {
		if (this.props.valuePromise instanceof Promise) {
			this.props.valuePromise.then(values => this.setState({ values }));
		} else {
			this.setState({
				values: this.props.valuePromise,
			});
		}
	}

	public render() {
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
				<Selector
					{...selectorProps}
					multiple={true}
					value={this.props.selectedValues || this.state.selectedValues}
					onChange={this.onMultipleChange}
				/>
			);
		} else {
			selector = (
				<Selector
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

	private onOk() {
		if (this.props.multiple) {
			this.props.onValuesSelect(this.state.values!.filter(val => this.hasValue(val)));
		} else {
			this.props.onValueSelect(this.props.selectedValue ? this.props.selectedValue : null);
		}
	}

	private onCancel() {
		this.props.onCancel();
	}

	private onSingleChange(value: T) {
		this.onChange([value]);

		if (!this.props.multiple) {
			this.props.onValueClick(value);
		}
	}

	private onMultipleChange(values: T[]) {
		this.onChange(values);

		if (this.props.multiple) {
			this.props.onValuesClick(values);
		}
	}

	private onChange(selectedValues: T[]) {
		this.setState({
			selectedValues,
		});
	}
}
