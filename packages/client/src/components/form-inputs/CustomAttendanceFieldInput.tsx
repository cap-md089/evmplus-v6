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

import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldFile,
} from 'common-lib';
import * as React from 'react';
import {
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	NumberInput,
	TextInput,
} from '../forms/SimpleForm';
import EnumRadioButton from './EnumRadioButton';
import { BooleanForField } from './FormBlock';
import { InputProps } from './Input';

export default class CustomAttendanceFieldInput extends React.Component<
	InputProps<CustomAttendanceField>
> {
	public constructor(props: InputProps<CustomAttendanceField>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: {
					type: CustomAttendanceFieldEntryType.TEXT,
					title: '',
					preFill: '',
					displayToMember: false,
					allowMemberToModify: false,
				},
			});
		}

		this.onUpdate = this.onUpdate.bind(this);
	}

	public render() {
		if (!this.props.value) {
			throw new Error('Value required');
		}

		const value = this.props.value;

		return (
			<FormBlock<CustomAttendanceField>
				name={`customAttendanceFieldInput-${this.props.index}`}
				onFormChange={this.onUpdate}
				onInitialize={this.props.onInitialize}
				value={value}
			>
				<Label>Custom Field Type</Label>
				<EnumRadioButton<CustomAttendanceFieldEntryType>
					name="type"
					labels={['Text', 'Number', 'Date', 'Checkbox', 'File']}
					values={[
						CustomAttendanceFieldEntryType.TEXT,
						CustomAttendanceFieldEntryType.NUMBER,
						CustomAttendanceFieldEntryType.DATE,
						CustomAttendanceFieldEntryType.CHECKBOX,
						CustomAttendanceFieldEntryType.FILE,
					]}
					defaultValue={CustomAttendanceFieldEntryType.TEXT}
					index={this.props.index}
					key="type"
				/>

				<Label>Field Title</Label>
				<TextInput key="title" name="title" value={value.title} />

				{value.type !== CustomAttendanceFieldEntryType.FILE ? (
					<Label>Field PreFill Value</Label>
				) : null}
				{this.getPreFillInput(value)}

				<Label>Display Field To Member</Label>
				<Checkbox key="displayToMember" name="displayToMember" index={this.props.index} />

				<Label>Allow Member To Modify Field Value</Label>
				<Checkbox
					key="allowMemberToModify"
					name="allowMemberToModify"
					index={this.props.index}
				/>
			</FormBlock>
		);
	}

	private onUpdate(
		newValue: CustomAttendanceField,
		error: BooleanForField<CustomAttendanceField>,
		changed: BooleanForField<CustomAttendanceField>,
		hasError: boolean,
		fieldChanged: keyof CustomAttendanceField,
	) {
		const name = `customAttendanceFieldInput-${this.props.index}`;

		if (fieldChanged === 'type') {
			if (newValue.type === CustomAttendanceFieldEntryType.CHECKBOX) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.CHECKBOX,
						preFill: false,
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.DATE) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.DATE,
						preFill: Date.now(),
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.FILE) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.FILE,
					} as CustomAttendanceFieldFile,
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.NUMBER) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.NUMBER,
						preFill: 0,
					},
				});
			} else if (newValue.type === CustomAttendanceFieldEntryType.TEXT) {
				this.props.onUpdate?.({
					name,
					value: {
						allowMemberToModify: newValue.allowMemberToModify,
						displayToMember: newValue.displayToMember,
						title: newValue.title,
						type: CustomAttendanceFieldEntryType.TEXT,
						preFill: '',
					},
				});
			} else {
				throw new Error('Weird state');
			}
		} else {
			this.props.onUpdate?.({
				name,
				value: newValue,
			});
		}
	}

	private getPreFillInput(inValue: CustomAttendanceField) {
		switch (inValue.type) {
			case CustomAttendanceFieldEntryType.TEXT:
				return <TextInput key="prefill" name="preFill" value={inValue.preFill} />;
			case CustomAttendanceFieldEntryType.NUMBER:
				return <NumberInput key="prefill" name="preFill" value={inValue.preFill} />;
			case CustomAttendanceFieldEntryType.CHECKBOX:
				return (
					<Checkbox
						key="prefill"
						name="preFill"
						value={inValue.preFill}
						index={this.props.index}
					/>
				);
			case CustomAttendanceFieldEntryType.DATE:
				return (
					<DateTimeInput
						key="prefill"
						name="preFill"
						value={inValue.preFill}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				);
			default:
				return null;
		}
	}
}
