import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldFile
} from 'common-lib';
import * as React from 'react';
import {
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	NumberInput,
	TextInput
} from '../forms/SimpleForm';
import { InputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import { BooleanForField } from './FormBlock';

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
					allowMemberToModify: false
				}
			});
		}

		this.onUpdate = this.onUpdate.bind(this);
	}

	public render() {
		if (!this.props.value) {
			throw new Error('Value required');
		}

		const CAFEntryType = SimpleRadioButton as new () => SimpleRadioButton<
			CustomAttendanceFieldEntryType
		>;

		const value = this.props.value;

		return (
			<FormBlock<CustomAttendanceField>
				name={`customAttendanceFieldInput-${this.props.index}`}
				onFormChange={this.onUpdate}
				onInitialize={this.props.onInitialize}
				value={value}
			>
				<Label>Custom Field Type</Label>
				<CAFEntryType
					name="type"
					labels={['Text', 'Number', 'Date', 'Checkbox', 'File']}
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
		value: CustomAttendanceField,
		error: BooleanForField<CustomAttendanceField>,
		changed: BooleanForField<CustomAttendanceField>,
		hasError: boolean,
		fieldChanged: keyof CustomAttendanceField
	) {
		if (fieldChanged === 'type') {
			if (value.type === CustomAttendanceFieldEntryType.CHECKBOX) {
				value = {
					allowMemberToModify: value.allowMemberToModify,
					displayToMember: value.displayToMember,
					title: value.title,
					type: CustomAttendanceFieldEntryType.CHECKBOX,
					preFill: false
				};
			}
			if (value.type === CustomAttendanceFieldEntryType.DATE) {
				value = {
					allowMemberToModify: value.allowMemberToModify,
					displayToMember: value.displayToMember,
					title: value.title,
					type: CustomAttendanceFieldEntryType.DATE,
					preFill: Date.now()
				};
			}
			if (value.type === CustomAttendanceFieldEntryType.FILE) {
				value = {
					allowMemberToModify: value.allowMemberToModify,
					displayToMember: value.displayToMember,
					title: value.title,
					type: CustomAttendanceFieldEntryType.FILE
				} as CustomAttendanceFieldFile;
			}
			if (value.type === CustomAttendanceFieldEntryType.NUMBER) {
				value = {
					allowMemberToModify: value.allowMemberToModify,
					displayToMember: value.displayToMember,
					title: value.title,
					type: CustomAttendanceFieldEntryType.NUMBER,
					preFill: 0
				};
			}
			if (value.type === CustomAttendanceFieldEntryType.TEXT) {
				value = {
					allowMemberToModify: value.allowMemberToModify,
					displayToMember: value.displayToMember,
					title: value.title,
					type: CustomAttendanceFieldEntryType.TEXT,
					preFill: ''
				};
			}
		}
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: `customAttendanceFieldInput-${this.props.index}`,
				value
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
				return <Checkbox key="prefill" name="preFill" value={inValue.preFill} />;
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
