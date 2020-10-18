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
	AccountObject,
	applyCustomAttendanceFields,
	AttendanceRecord,
	AttendanceStatus,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldValue,
	effectiveManageEventPermissionForEvent,
	Either,
	Member,
	NewAttendanceRecord,
	Permissions,
	RawResolvedEventObject,
	RegistryValues,
	toReference,
	ClientUser,
} from 'common-lib';
import * as React from 'react';
import fetchApi, { fetchAPIForAccount } from '../../../lib/apis';
import { attendanceStatusLabels } from '../../../pages/events/EventViewer';
import Button from '../../Button';
import EnumRadioButton from '../../form-inputs/EnumRadioButton';
import SimpleForm, {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	NumberInput,
	TextBox,
	TextInput,
} from '../SimpleForm';

const clamp = (min: number, max: number, input: number) => Math.max(min, Math.min(max, input));

type FormState = NewAttendanceRecord & { usePartTime: boolean };

export interface AttendanceFormProps {
	account: AccountObject;
	member: ClientUser;
	event: RawResolvedEventObject;
	registry: RegistryValues;
	record?: AttendanceRecord;
	updateRecord: (record: Required<NewAttendanceRecord>, member: Member) => void;
	removeRecord: (record: AttendanceRecord) => void;
	recordMember?: Member | null;
	updated: boolean;
	signup: boolean;
	clearUpdated: () => void;
	index?: number;
}

interface AttendanceFormState {
	attendance: NewAttendanceRecord;
	usePartTime: boolean;
	saving: boolean;
	errorSaving: boolean;
	deleting: boolean;
}

const RenderCustomAttendanceFieldInput: React.FC<{
	field: CustomAttendanceFieldValue;
	disabled: boolean;
	key: string;
	onChange: (field: CustomAttendanceFieldValue) => void;
	registry: RegistryValues;
	index: number;
	indexInside: number;
}> = ({ field, disabled, onChange, registry, key, index, indexInside }) =>
	field.type === CustomAttendanceFieldEntryType.CHECKBOX ? (
		<Checkbox
			key={key}
			name={`ignore-${index}-${indexInside}`}
			onChange={value =>
				!disabled &&
				onChange({
					value,
					type: CustomAttendanceFieldEntryType.CHECKBOX,
					title: field.title,
				})
			}
			disabled={disabled}
			value={field.value}
		/>
	) : field.type === CustomAttendanceFieldEntryType.DATE ? (
		<DateTimeInput
			key={key}
			name={`ignore-${index}-${indexInside}`}
			disabled={disabled}
			originalTimeZoneOffset={registry.Website.Timezone}
			time={true}
			onChange={value =>
				!disabled &&
				onChange({
					value,
					type: CustomAttendanceFieldEntryType.DATE,
					title: field.title,
				})
			}
			value={field.value}
		/>
	) : field.type === CustomAttendanceFieldEntryType.FILE ? null : field.type ===
	  CustomAttendanceFieldEntryType.NUMBER ? (
		<NumberInput
			disabled={disabled}
			key={key}
			value={field.value}
			name={`ignore-${index}-${indexInside}`}
			onChange={value =>
				!disabled &&
				onChange({
					value: value!,
					type: CustomAttendanceFieldEntryType.NUMBER,
					title: field.title,
				})
			}
		/>
	) : (
		<TextInput
			name={`ignore-${index}-${indexInside}`}
			key={key}
			value={field.value}
			disabled={disabled}
			onChange={value =>
				!disabled &&
				onChange({
					value,
					type: CustomAttendanceFieldEntryType.TEXT,
					title: field.title,
				})
			}
		/>
	);

export default class AttendanceForm extends React.Component<
	AttendanceFormProps,
	AttendanceFormState
> {
	public state: AttendanceFormState;

	public constructor(props: AttendanceFormProps) {
		super(props);

		const customAttendanceFields = applyCustomAttendanceFields(
			props.event.customAttendanceFields,
		);

		if (props.record) {
			this.state = {
				attendance: {
					comments: props.record.comments,
					shiftTime: props.record.shiftTime,
					planToUseCAPTransportation: props.record.planToUseCAPTransportation,
					status: props.record.status,
					customAttendanceFieldValues: customAttendanceFields(
						props.record.customAttendanceFieldValues,
					),
				},
				errorSaving: false,
				usePartTime: false,
				saving: false,
				deleting: false,
			};
		} else {
			this.state = {
				attendance: {
					comments: '',
					shiftTime: null,
					planToUseCAPTransportation: false,
					status: AttendanceStatus.COMMITTEDATTENDED,
					customAttendanceFieldValues: customAttendanceFields([]),
				},
				errorSaving: false,
				usePartTime: false,
				saving: false,
				deleting: false,
			};
		}

		this.onAttendanceFormChange = this.onAttendanceFormChange.bind(this);
		this.onAttendanceFormSubmit = this.onAttendanceFormSubmit.bind(this);
		this.removeAttendanceRecord = this.removeAttendanceRecord.bind(this);
	}

	public render() {
		const canUsePartTime = this.props.event.signUpPartTime;

		const usePartTime = canUsePartTime && this.state.usePartTime;

		const eventLength = this.props.event.pickupDateTime - this.props.event.meetDateTime;

		const arrival =
			this.state.attendance.shiftTime?.arrivalTime ?? this.props.event.meetDateTime;
		const departure =
			this.state.attendance.shiftTime?.departureTime ?? this.props.event.pickupDateTime;

		const beforeArrival =
			clamp(this.props.event.meetDateTime, this.props.event.pickupDateTime, arrival) -
			this.props.event.meetDateTime;
		const afterDeparture =
			this.props.event.pickupDateTime -
			clamp(this.props.event.meetDateTime, this.props.event.pickupDateTime, departure);

		const timeDuring = eventLength - (beforeArrival + afterDeparture);

		const percentBeforeArrival = arrival > departure ? 1 : beforeArrival / eventLength;
		const percentAfterDeparture = arrival > departure ? 0 : afterDeparture / eventLength;
		const percentDuring = 1 - (percentBeforeArrival + percentAfterDeparture);

		return (
			<SimpleForm<NewAttendanceRecord & { usePartTime: boolean }>
				id="attendanceSingupForm"
				values={{
					...this.state.attendance,
					usePartTime: this.state.usePartTime,
					// Index here is not necessarily the same as the enum values
					// If there is no record (a new one is being made), the index is for
					// 'Will attend' vs 'Will NOT attend'
					status: !!this.props.record
						? this.state.attendance.status
						: this.state.attendance.status === AttendanceStatus.COMMITTEDATTENDED
						? AttendanceStatus.COMMITTEDATTENDED
						: AttendanceStatus.NOSHOW,
				}}
				onChange={this.onAttendanceFormChange}
				onSubmit={this.onAttendanceFormSubmit}
				submitInfo={{
					text: this.state.saving
						? !!this.props.record
							? 'Updating...'
							: 'Signing up...'
						: !!this.props.record
						? 'Update information'
						: 'Sign up',
					disabled: this.state.saving || this.state.deleting,
				}}
			>
				{this.props.updated ? <TextBox>Attendance information updated</TextBox> : null}

				<Label>Comments</Label>
				<BigTextBox name="comments" />
				{this.props.event.transportationProvided ? (
					<Label>Are you using CAP transportation?</Label>
				) : null}

				{this.props.event.transportationProvided ? (
					<Checkbox key="2" name="planToUseCAPTransportation" />
				) : null}

				{canUsePartTime ? <Label>Sign up part time?</Label> : null}
				{canUsePartTime ? <Checkbox name="usePartTime" /> : null}

				{usePartTime ? (
					<TextBox name="null">
						<div className="partTimeSignupDisplay">
							<div
								className="timeBefore"
								style={{
									width: `${percentBeforeArrival * 100}%`,
								}}
							/>
							<div
								className="timeDuring"
								style={{
									width: `${percentDuring * 100}%`,
								}}
							/>
							<div
								className="timeAfter"
								style={{
									width: `${percentAfterDeparture * 100}%`,
								}}
							/>
							Duration:{' '}
							{timeDuring >= 3600 * 1000
								? `${Math.round(timeDuring / (3600 * 1000))} hrs `
								: null}
							{`${Math.round((timeDuring % (3600 * 1000)) / (1000 * 60))} mins`}
						</div>
					</TextBox>
				) : null}

				{usePartTime ? (
					<FormBlock name="shiftTime">
						<Label>Arrival time</Label>
						<DateTimeInput
							name="arrivalTime"
							time={true}
							originalTimeZoneOffset={'America/New_York'}
						/>

						<Label>Departure time</Label>
						<DateTimeInput
							name="departureTime"
							time={true}
							originalTimeZoneOffset={'America/New_York'}
						/>
					</FormBlock>
				) : null}

				<Label>Attendance status</Label>
				{!!this.props.record ? (
					<EnumRadioButton<AttendanceStatus>
						name="status"
						index={this.props.index}
						labels={attendanceStatusLabels}
						values={[
							AttendanceStatus.COMMITTEDATTENDED,
							AttendanceStatus.RESCINDEDCOMMITMENTTOATTEND,
							AttendanceStatus.NOSHOW,
							AttendanceStatus.NOTPLANNINGTOATTEND,
						]}
						defaultValue={AttendanceStatus.COMMITTEDATTENDED}
					/>
				) : (
					<EnumRadioButton<AttendanceStatus>
						name="status"
						index={this.props.index}
						labels={['I will attend', 'I will NOT attend']}
						values={[
							AttendanceStatus.COMMITTEDATTENDED,
							AttendanceStatus.NOTPLANNINGTOATTEND,
						]}
						defaultValue={AttendanceStatus.COMMITTEDATTENDED}
					/>
				)}

				{this.getCustomFields(
					this.props.event,
					this.state.attendance.customAttendanceFieldValues,
				)}

				{!!this.props.record &&
				effectiveManageEventPermissionForEvent(this.props.member)(this.props.event) ===
					Permissions.ManageEvent.FULL ? (
					<TextBox name="null">
						<Button
							onClick={this.removeAttendanceRecord}
							disabled={this.state.deleting || this.state.saving}
						>
							{this.state.deleting
								? 'Deleting record...'
								: 'Remove attendance record'}
						</Button>
					</TextBox>
				) : null}
			</SimpleForm>
		);
	}

	private getCustomFields(
		event: RawResolvedEventObject,
		rawFields: CustomAttendanceFieldValue[],
	) {
		if (this.props.record) {
			if (effectiveManageEventPermissionForEvent(this.props.member)(event)) {
				const fields = rawFields;

				return fields.flatMap((field, index) => [
					<Label key={`custom-attendance-field-${index * 2}`}>{field.title}</Label>,
					RenderCustomAttendanceFieldInput({
						key: `custom-attendance-field-${index * 2 + 1}`,
						field,
						onChange: this.getFieldChanger(field.title),
						disabled: false,
						registry: this.props.registry,
						index: this.props.index ?? -1,
						indexInside: index,
					}),
				]);
			} else {
				const fields = rawFields.filter(
					field =>
						event.customAttendanceFields.find(rec => rec.title === field.title)
							?.displayToMember,
				);

				return fields.flatMap((field, index) => [
					<Label key={`custom-attendance-field-${index * 2}`}>{field.title}</Label>,
					RenderCustomAttendanceFieldInput({
						key: `custom-attendance-field-${index * 2 + 1}`,
						field,
						onChange: this.getFieldChanger(field.title),
						disabled: !event.customAttendanceFields.find(
							rec => rec.title === field.title,
						)?.allowMemberToModify,
						index: this.props.index ?? -1,
						indexInside: index,
						registry: this.props.registry,
					}),
				]);
			}
		} else {
			const fields = rawFields.filter(
				field =>
					event.customAttendanceFields.find(rec => rec.title === field.title)
						?.displayToMember,
			);

			return fields.flatMap((field, index) => [
				<Label key={`custom-attendance-field-${index * 2}`}>{field.title}</Label>,
				RenderCustomAttendanceFieldInput({
					key: `custom-attendance-field-${index * 2 + 1}`,
					field,
					onChange: this.getFieldChanger(field.title),
					disabled: !event.customAttendanceFields.find(rec => rec.title === field.title)
						?.allowMemberToModify,
					registry: this.props.registry,
					index: this.props.index ?? -1,
					indexInside: index,
				}),
			]);
		}
	}

	private getFieldChanger(title: string) {
		const prevRec = { ...this.state.attendance, usePartTime: this.state.usePartTime };

		console.log(title);

		return (newValue: CustomAttendanceFieldValue) => {
			console.log(newValue);
			console.log(
				prevRec.customAttendanceFieldValues.map(oldRec =>
					oldRec.title === newValue.title ? newValue : oldRec,
				),
			);
			this.onAttendanceFormChange(
				{
					...prevRec,
					customAttendanceFieldValues: prevRec.customAttendanceFieldValues.map(oldRec =>
						oldRec.title === newValue.title ? newValue : oldRec,
					),
				},
				void 0,
				void 0,
				void 0,
				'customAttendanceFieldValues',
			);
		};
	}

	private onAttendanceFormChange(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean },
		error: any,
		chnaged: any,
		hasError: any,
		fieldChanged: keyof FormState,
	) {
		if ((fieldChanged as string).startsWith('ignore')) {
			return;
		}

		let arrivalTime = attendanceSignup.shiftTime?.arrivalTime || this.props.event.meetDateTime;
		let departureTime =
			attendanceSignup.shiftTime?.departureTime || this.props.event.pickupDateTime;

		let shiftTime = attendanceSignup.shiftTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];

			shiftTime = {
				arrivalTime,
				departureTime,
			};
		}

		this.setState({
			attendance: {
				comments: attendanceSignup.comments,
				shiftTime,
				planToUseCAPTransportation: attendanceSignup.planToUseCAPTransportation,
				status: attendanceSignup.status,
				customAttendanceFieldValues: attendanceSignup.customAttendanceFieldValues,
			},
			usePartTime: attendanceSignup.usePartTime,
			errorSaving: false,
		});

		this.props.clearUpdated();
	}

	private async onAttendanceFormSubmit(
		attendanceSignup: NewAttendanceRecord & { usePartTime: boolean },
	) {
		let arrivalTime = attendanceSignup.shiftTime?.arrivalTime || this.props.event.meetDateTime;
		let departureTime =
			attendanceSignup.shiftTime?.departureTime || this.props.event.pickupDateTime;

		let shiftTime = attendanceSignup.shiftTime;

		if (arrivalTime > departureTime) {
			[arrivalTime, departureTime] = [departureTime, arrivalTime];

			shiftTime = {
				arrivalTime,
				departureTime,
			};
		}

		shiftTime = shiftTime
			? {
					arrivalTime: clamp(
						this.props.event.meetDateTime,
						this.props.event.pickupDateTime,
						shiftTime.arrivalTime,
					),
					departureTime: clamp(
						this.props.event.meetDateTime,
						this.props.event.pickupDateTime,
						shiftTime.departureTime,
					),
			  }
			: null;

		const newRecord: NewAttendanceRecord = {
			comments: attendanceSignup.comments,
			shiftTime,
			planToUseCAPTransportation: this.props.event.transportationProvided
				? attendanceSignup.planToUseCAPTransportation
				: false,
			status: attendanceSignup.status,
			customAttendanceFieldValues: attendanceSignup.customAttendanceFieldValues,
		};

		this.setState({
			saving: true,
		});

		if (this.props.record) {
			const api =
				this.props.record.sourceAccountID === this.props.account.id
					? fetchApi
					: fetchAPIForAccount(this.props.record.sourceAccountID);

			const result = await api.events.attendance.modify(
				{ id: this.props.record.sourceEventID.toString() },
				{ ...newRecord, memberID: this.props.record.memberID },
			);

			this.setState({
				errorSaving: Either.isLeft(result),
				saving: false,
			});
		} else {
			const result = await fetchApi.events.attendance.add(
				{ id: this.props.event.id.toString() },
				{ ...newRecord, memberID: toReference(this.props.member) },
			);

			this.setState({
				errorSaving: Either.isLeft(result),
				saving: false,
			});
		}

		this.props.updateRecord(
			{
				...newRecord,
				shiftTime: this.props.record?.shiftTime ?? null,
				memberID: this.props.record?.memberID ?? toReference(this.props.member),
			},
			this.props.recordMember!,
		);
	}

	private async removeAttendanceRecord() {
		if (!this.props.record) {
			return;
		}

		this.setState({
			deleting: true,
		});

		console.log(this.props.record.sourceAccountID);
		console.log(this.props.account.id);
		console.log(this.props.record.sourceAccountID === this.props.account.id);

		const api =
			this.props.record.sourceAccountID === this.props.account.id
				? fetchApi
				: fetchAPIForAccount(this.props.record.sourceAccountID);

		await api.events.attendance.delete(
			{ id: this.props.record.sourceEventID.toString() },
			{ member: toReference(this.props.record.memberID) },
		);

		this.setState({
			deleting: false,
		});

		this.props.removeRecord(this.props.record);
	}
}
