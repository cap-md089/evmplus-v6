import { CustomAttendanceField, CustomAttendanceFieldEntryType } from 'common-lib';
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
			<FormBlock
				name={`customAttendanceFieldInput-${this.props.index}`}
				onUpdate={this.onUpdate}
				onInitialize={this.props.onInitialize}
			>
				<Label>Custom Field Type</Label>
				<CAFEntryType
					name="type"
					labels={['Text', 'Number', 'Date', 'Checkbox', 'File']}
					value={
						typeof value.type === 'string'
							? CustomAttendanceFieldEntryType.TEXT
							: value.type
					}
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
				<Checkbox
					key="displayToMember"
					name="displayToMember"
					value={value.displayToMember}
				/>

				<Label>Allow Member To Modify Field Value</Label>
				<Checkbox
					key="allowMemberToModify"
					name="allowMemberToModify"
					value={value.allowMemberToModify}
				/>
			</FormBlock>
		);
	}

	private onUpdate(e: { name: string; value: CustomAttendanceField }) {
		if (this.props.onUpdate) {
			this.props.onUpdate(e);
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
