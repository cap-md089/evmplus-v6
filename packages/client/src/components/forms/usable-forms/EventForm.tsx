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

import {
	AccountObject,
	AccountType,
	areMembersTheSame,
	ClientUser,
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	defaultRadioFromLabels,
	EchelonEventNumber,
	effectiveManageEventPermission,
	Either,
	emptyFromLabels,
	emptySimpleFromLabels,
	EventStatus,
	ExternalPointOfContact,
	FileObject,
	FullTeamObject,
	getMemberEmail,
	getMemberPhone,
	InternalPointOfContact,
	isOneOfSelected,
	labels,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	NewEventObject,
	OtherMultCheckboxReturn,
	Permissions,
	PointOfContactType,
	RadioReturnWithOther,
	RegistryValues,
	SimpleMultCheckboxReturn,
	stringifyMemberReference,
	toReference,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import fetchApi from '../../../lib/apis';
import Button from '../../Button';
import CustomAttendanceFieldInput from '../../form-inputs/CustomAttendanceFieldInput';
import EnumRadioButton from '../../form-inputs/EnumRadioButton';
import { BooleanForField } from '../../form-inputs/FormBlock';
import { InputProps } from '../../form-inputs/Input';
import POCInput, { InternalPointOfContactEdit, POCInputProps } from '../../form-inputs/POCInput';
import SimpleMultCheckbox from '../../form-inputs/SimpleMultCheckbox';
import Select from '../../form-inputs/Select';
import SimpleForm, {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Divider,
	FileInput,
	FormBlock,
	FormValidator,
	Label,
	ListEditor,
	NumberInput,
	OtherMultCheckbox,
	RadioButtonWithOther,
	TeamSelector,
	TextBox,
	TextInput,
	Title,
} from '../SimpleForm';

interface EventFormProps {
	registry: RegistryValues;
	event: NewEventFormValues;
	isEventUpdate?: boolean;
	account: AccountObject;
	member: ClientUser;
	teamList: FullTeamObject[];
	memberList: Member[];
	onEventChange: (event: NewEventFormValues, valid: boolean) => void;
	onEventFormSubmit: (event: MaybeObj<NewEventFormValues>) => void;
	saving: boolean;
	formDisabled?: boolean;
}

export enum RequirementTags {
	NotNeeded,
	L2_1,
	L2_2,
	L2_3,
	L2_4,
	L2_5,
	L2_6,
	L2_7,
	L2_8,
	L2_9,
	L2_10,
	L2_11,
	L2_12,
	L2_13,
	L2_14,
	L2_15,
	L2_16,
	L3_1,
	L3_2,
	L3_3,
	L3_4,
	L3_5,
	L3_6,
	L3_7,
	L3_8,
	L3_9,
	L3_10,
	L3_11,
	L3_12,
	L3_13,
	L3_14,
	L3_15,
	L3_16,
	L4_1,
	L4_2,
	L4_3,
	L4_4,
	L4_5,
	L4_6,
	L4_7,
	L4_8,
	L4_9,
	L4_10,
	L4_11,
	L4_12,
	L4_13,
	L4_14,
	L4_15,
	L5_1,
	L5_2,
	L5_3,
	L5_4,
	L5_5,
	L5_6,
	L5_7,
	L5_8,
	L5_9,
	L5_10,
	L5_11,
}

const requirementTagLabels = [
	'Not Needed',
	'VIR LEVEL 2- Accountability & Responsibility of the Adult Leader',
	'VIR LEVEL 2- Basic Drill',
	'VIR LEVEL 2- BLOCK: Part 1 & 2 CADET',
	'VIR LEVEL 2- BLOCK: Part 1 MILITARY',
	'VIR LEVEL 2- BLOCK: Part 1 NEW/GENERAL AND PROFESSIONAL',
	'VIR LEVEL 2- BLOCK: Part 2 MILITARY',
	'VIR LEVEL 2- BLOCK: Part 2 NEW/GENERAL',
	'VIR LEVEL 2- BLOCK: Part 2 PROFESSIONAL',
	'VIR LEVEL 2- Bringing Your Service to the Civil Air Patrol ',
	'VIR LEVEL 2- Cadet Protection from the Senior Perspective',
	'VIR LEVEL 2- CAP Communications Fundamentals',
	'VIR LEVEL 2- Choosing Your Duty Assignment & Specialty Track',
	'VIR LEVEL 2- Communication Fundamentals',
	'VIR LEVEL 2- Leadership Fundamentals',
	'VIR LEVEL 2- Leading Volunteers',
	'VIR LEVEL 2- Mentoring',
	'VIR LEVEL 3- Advanced Civil Air Patrol Communications',
	'VIR LEVEL 3- Care and Feeding of a Member ',
	'VIR LEVEL 3- Compliance Requirements',
	'VIR LEVEL 3- Core Values for Leaders',
	'VIR LEVEL 3- Data-Driven Decision Making',
	'VIR LEVEL 3- Developing our Members',
	'VIR LEVEL 3- Effective Volunteer Teams',
	'VIR LEVEL 3- Finance and Physical Assets',
	'VIR LEVEL 3- Leading People & Managing Stuff',
	'VIR LEVEL 3- Legal & Complaint Process',
	'VIR LEVEL 3- Meetings & Meeting Planning',
	'VIR LEVEL 3- Motivating & Mentoring',
	'VIR LEVEL 3- Public Affairs and Branding',
	'VIR LEVEL 3- Reaching Outside the Squadron',
	'VIR LEVEL 3- Safety & Risk Management',
	'VIR LEVEL 3- Squadrons & The Missions',
	'VIR LEVEL 4- Boards and Board Leadership',
	'VIR LEVEL 4- Developing Personal Leadership Philosophy',
	'VIR LEVEL 4- Effective Communication with External Partners',
	'VIR LEVEL 4- Leadership Challenges Today',
	'VIR LEVEL 4- Maintaining High Performing Teams',
	'VIR LEVEL 4- Management Principles',
	'VIR LEVEL 4- Mentoring Skills and Program Development',
	'VIR LEVEL 4- Operations at Group and Wing Levels',
	'VIR LEVEL 4- Planning and Leading A Major Activity',
	'VIR LEVEL 4- Prioritization and Time Management',
	'VIR LEVEL 4- Recruiting and Retention',
	'VIR LEVEL 4- Shaping Cultures of Trust and Innovation',
	'VIR LEVEL 4- Staff Processes',
	'VIR LEVEL 4- The Civil Air Patrol Safety Program for Group or Wing Leader',
	'VIR LEVEL 4- Using New Media to Communicate',
	'VIR SCC- Appointing and Utilizing Staff',
	'VIR SCC- Command Responsibility in Finance',
	'VIR SCC- Commander’s Intent',
	'VIR SCC- Communication Skills for Command',
	'VIR SCC- Customs, Courtesies and Ceremonies',
	'VIR SCC- How Commanders Use eServices',
	'VIR SCC- Partnership Between CAC & Commander',
	'VIR SCC- Responsibilities of Squadron/Flight Commander',
	'VIR SCC- Stewardship and Risk Management',
	'VIR SCC- Taking Command',
	'VIR SCC- The Complaint Process and Your Responsibility',
];

export const defaultEmailBody =
	'%%MEMBER_NAME%%, you are now signed up for event %%EVENT_NAME%% on %%START_DATE%%.' +
	'\n\nSee [the event page here](%%EVENT_LINK%%) for complete event details.';

export interface NewEventFormValues {
	name: string;
	subtitle: string;
	meetDateTime: number;
	meetLocation: string;
	startDateTime: number;
	location: string;
	endDateTime: number;
	pickupDateTime: number;
	pickupLocation: string;
	transportationProvided: boolean;
	transportationDescription: string;
	desiredNumberOfParticipants: number;
	highAdventureDescription: string;
	requiredEquipment: string[];
	eventWebsite: string;
	comments: string;
	memberComments: string;
	acceptSignups: boolean;
	signUpDenyMessage: null | string;
	showUpcoming: boolean;
	complete: boolean;
	administrationComments: string;
	status: EventStatus;
	pointsOfContact: Array<InternalPointOfContactEdit | ExternalPointOfContact>;
	customAttendanceFields: CustomAttendanceField[];
	signUpPartTime: boolean;
	smuniform: SimpleMultCheckboxReturn;
	cuniform: SimpleMultCheckboxReturn;
	mealsDescription: OtherMultCheckboxReturn;
	lodgingArrangments: OtherMultCheckboxReturn;
	activity: OtherMultCheckboxReturn;
	requiredForms: OtherMultCheckboxReturn;
	teamID: number | null;
	limitSignupsToTeam: boolean | null;
	fileIDs: string[];
	privateAttendance: boolean;
	groupEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	regionEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	requirementTag: RequirementTags | -1;

	// These are special values used
	useRegistration: boolean;
	registration: {
		deadline: number;
		information: string;
	};
	useParticipationFee: boolean;
	participationFee: {
		feeAmount: number;
		feeDue: number;
	};
	useEmailBody: boolean;
	emailBody: {
		body: string;
	};
}

export const convertFormValuesToEvent = (event: NewEventFormValues): MaybeObj<NewEventObject> =>
	Maybe.map((pointsOfContact: Array<InternalPointOfContact | ExternalPointOfContact>) => ({
		acceptSignups: event.acceptSignups,
		activity: event.activity,
		administrationComments: event.administrationComments,
		comments: event.comments,
		memberComments: event.memberComments,
		complete: event.complete,
		desiredNumberOfParticipants: event.desiredNumberOfParticipants,
		endDateTime: event.endDateTime,
		eventWebsite: event.eventWebsite,
		fileIDs: event.fileIDs,
		groupEventNumber: event.groupEventNumber,
		highAdventureDescription: event.highAdventureDescription,
		location: event.location,
		lodgingArrangments: event.lodgingArrangments,
		mealsDescription: event.mealsDescription,
		meetDateTime: event.meetDateTime,
		meetLocation: event.meetLocation,
		name: event.name,
		participationFee: event.useParticipationFee ? event.participationFee : null,
		pickupDateTime: event.pickupDateTime,
		pickupLocation: event.pickupLocation,
		pointsOfContact,
		customAttendanceFields: event.customAttendanceFields,
		regionEventNumber: event.regionEventNumber,
		registration: event.useRegistration ? event.registration : null,
		requiredEquipment: event.requiredEquipment,
		requiredForms: event.requiredForms,
		requirementTag:
			event.requirementTag !== -1 && event.requirementTag !== 0
				? requirementTagLabels[event.requirementTag]
				: null,
		showUpcoming: event.showUpcoming,
		signUpDenyMessage: event.signUpDenyMessage,
		signUpPartTime: event.signUpPartTime,
		startDateTime: event.startDateTime,
		status: event.status,
		subtitle: event.subtitle,
		teamID:
			event.teamID === null || (event.teamID as any) === '' || event.teamID === undefined
				? null
				: parseInt(event.teamID.toString(), 10),
		limitSignupsToTeam:
			event.teamID === null || (event.teamID as any) === '' || event.teamID === undefined
				? null
				: event.limitSignupsToTeam,
		transportationDescription: event.transportationDescription,
		transportationProvided: event.transportationProvided,
		smuniform: event.smuniform,
		cuniform: event.cuniform,
		privateAttendance: event.privateAttendance,
		emailBody: event.useEmailBody ? Maybe.some(event.emailBody) : Maybe.none(),
	}))(
		Maybe.And(
			event.pointsOfContact.map<MaybeObj<InternalPointOfContact | ExternalPointOfContact>>(
				poc =>
					poc.type === PointOfContactType.EXTERNAL
						? Maybe.some(poc)
						: Maybe.map<MemberReference, InternalPointOfContact>(memberReference => ({
								memberReference,
								email: poc.email,
								phone: poc.phone,
								position: poc.position,
								publicDisplay: poc.publicDisplay,
								receiveEventUpdates: poc.receiveEventUpdates,
								receiveRoster: poc.receiveRoster,
								receiveSignUpUpdates: poc.receiveSignUpUpdates,
								receiveUpdates: poc.receiveUpdates,
								type: PointOfContactType.INTERNAL,
						  }))(poc.memberReference),
			),
		),
	);

export const emptyEventFormValues = (): NewEventFormValues => ({
	name: '',
	subtitle: '',
	meetDateTime: +DateTime.utc(),
	meetLocation: '',
	startDateTime: +DateTime.utc(),
	location: '',
	endDateTime: +DateTime.utc(),
	pickupDateTime: +DateTime.utc(),
	pickupLocation: '',
	transportationProvided: false,
	transportationDescription: '',
	smuniform: emptySimpleFromLabels(labels.SMUniforms),
	cuniform: emptySimpleFromLabels(labels.CUniforms),
	desiredNumberOfParticipants: 8,
	useRegistration: false,
	registration: {
		deadline: Date.now(),
		information: '',
	},
	useParticipationFee: false,
	participationFee: {
		feeAmount: 0,
		feeDue: Date.now(),
	},
	mealsDescription: emptyFromLabels(labels.Meals),
	lodgingArrangments: emptyFromLabels(labels.LodgingArrangments),
	activity: emptyFromLabels(labels.Activities),
	highAdventureDescription: '',
	requiredEquipment: [],
	eventWebsite: '',
	requiredForms: emptyFromLabels(labels.RequiredForms),
	comments: '',
	memberComments: '',
	acceptSignups: true,
	signUpDenyMessage: '',
	showUpcoming: true,
	groupEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	regionEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	complete: false,
	administrationComments: '',
	status: EventStatus.DRAFT,
	pointsOfContact: [],
	customAttendanceFields: [],
	signUpPartTime: false,
	teamID: null,
	limitSignupsToTeam: false,
	fileIDs: [],
	privateAttendance: false,
	useEmailBody: true,
	emailBody: { body: defaultEmailBody },
	requirementTag: 0,
});

export const convertToFormValues = (event: NewEventObject): NewEventFormValues => ({
	acceptSignups: event.acceptSignups,
	activity: event.activity,
	administrationComments: event.administrationComments,
	comments: event.comments,
	complete: event.complete,
	desiredNumberOfParticipants: event.desiredNumberOfParticipants,
	endDateTime: event.endDateTime,
	eventWebsite: event.eventWebsite,
	fileIDs: event.fileIDs,
	groupEventNumber: event.groupEventNumber,
	highAdventureDescription: event.highAdventureDescription,
	location: event.location,
	lodgingArrangments: event.lodgingArrangments,
	mealsDescription: event.mealsDescription,
	meetDateTime: event.meetDateTime,
	meetLocation: event.meetLocation,
	memberComments: event.memberComments,
	name: event.name,
	participationFee: event.participationFee || {
		feeAmount: 0,
		feeDue: Date.now(),
	},
	useParticipationFee: !!event.participationFee,
	pickupDateTime: event.pickupDateTime,
	pickupLocation: event.pickupLocation,
	pointsOfContact: event.pointsOfContact.map(poc =>
		poc.type === PointOfContactType.EXTERNAL
			? poc
			: {
					email: poc.email,
					phone: poc.phone,
					position: poc.position,
					publicDisplay: poc.publicDisplay,
					receiveEventUpdates: poc.receiveEventUpdates,
					receiveRoster: poc.receiveRoster,
					receiveSignUpUpdates: poc.receiveSignUpUpdates,
					receiveUpdates: poc.receiveUpdates,
					memberReference: Maybe.some(poc.memberReference),
					type: PointOfContactType.INTERNAL,
			  },
	),
	customAttendanceFields: event.customAttendanceFields,
	regionEventNumber: event.regionEventNumber,
	registration: event.registration || {
		deadline: Date.now(),
		information: '',
	},
	useRegistration: !!event.registration,
	requiredEquipment: event.requiredEquipment,
	requiredForms: event.requiredForms,
	showUpcoming: event.showUpcoming,
	signUpDenyMessage: event.signUpDenyMessage,
	signUpPartTime: event.signUpPartTime,
	startDateTime: event.startDateTime,
	status: event.status,
	subtitle: event.subtitle,
	teamID: event.teamID ?? null,
	transportationDescription: event.transportationDescription,
	transportationProvided: event.transportationProvided,
	smuniform: event.smuniform,
	cuniform: event.cuniform,
	limitSignupsToTeam: event.limitSignupsToTeam ?? null,
	privateAttendance: event.privateAttendance,
	useEmailBody: Maybe.isSome(event.emailBody),
	emailBody: Maybe.isSome(event.emailBody) ? event.emailBody.value : { body: defaultEmailBody },
	requirementTag: requirementTagLabels.indexOf(event.requirementTag ?? ''),
});

const eventValidator: FormValidator<NewEventFormValues> = {
	transportationDescription: (desc, values) => desc !== '' || !values.transportationProvided,
	pickupLocation: loc => !!loc,
	location: loc => !!loc,
	meetLocation: loc => !!loc,
	name: loc => !!loc,
	startDateTime: (start, values) => start >= values.meetDateTime,
	endDateTime: (end, values) => end >= values.startDateTime,
	pickupDateTime: (pickup, values) => pickup >= values.endDateTime,
	smuniform: isOneOfSelected,
	cuniform: isOneOfSelected,
	requiredEquipment: equipment =>
		equipment.map(s => !!s).reduce((prev, curr) => prev && curr, true),
};

interface EventFormState {
	mde: null | typeof import('simplemde');
	comments: null | SimpleMDE;
	memberComments: null | SimpleMDE;
	emailBody: null | SimpleMDE;
	addPOCbyID: number | null;
	addingPOCbyID: boolean;
	pocAddbyIDError: string | null;
	files: FileObject[] | null;
	selectedFolder: string;
	selectedFiles: FileObject[];
}

export default class EventForm extends React.Component<EventFormProps, EventFormState> {
	public state: EventFormState = {
		mde: null,
		comments: null,
		memberComments: null,
		emailBody: null,
		addPOCbyID: null,
		addingPOCbyID: false,
		pocAddbyIDError: null,
		files: [],
		selectedFolder: '',
		selectedFiles: [],
	};

	private commentsRef = React.createRef<HTMLTextAreaElement>();
	private mbrcommentsRef = React.createRef<HTMLTextAreaElement>();
	private emailBodyRef = React.createRef<HTMLTextAreaElement>();

	public constructor(props: EventFormProps) {
		super(props);

		this.onEventChange = this.onEventChange.bind(this);
		this.onEventSubmit = this.onEventSubmit.bind(this);
		this.onAddPOC = this.onAddPOC.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		const { default: mde } = await import('simplemde');

		this.setState({ mde });

		const mdeOptions = {
			hideIcons: ['preview', 'side-by-side', 'fullscreen', 'image'],
			blockStyles: { italic: '_' },
			insertTexts: {
				horizontalRule: ['', '\n\n-----\n\n'],
				image: ['![](http://', ')'],
				link: ['[', '](http://)'],
				table: [
					'',
					'\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text      | Text     |\n\n',
				],
			},
			showIcons: ['table'],
			toolbar: [
				'bold',
				'italic',
				'strikethrough',
				'|',
				'heading-smaller',
				'heading-bigger',
				'|',
				'horizontal-rule',
				'table',
				'quote',
				'unordered-list',
				'ordered-list',
				'|',
				'link',
				'image',
				'|',
				'guide',
			],
		};

		if (this.commentsRef.current) {
			this.setState({
				comments: new mde({
					element: this.commentsRef.current,
					...mdeOptions,
					initialValue: this.props.event.comments,
				}),
			});
		}
		if (this.mbrcommentsRef.current) {
			this.setState({
				memberComments: new mde({
					element: this.mbrcommentsRef.current,
					...mdeOptions,
					initialValue: this.props.event.memberComments,
				}),
			});
		}
		if (this.emailBodyRef.current) {
			this.setState(
				{
					emailBody: new mde({
						element: this.emailBodyRef.current,
						...mdeOptions,
						initialValue: this.props.event.emailBody.body,
					}),
				},
				() => {
					this.state.emailBody?.value?.(this.props.event.emailBody.body);
				},
			);
		}
	}

	public render(): JSX.Element {
		const values = this.props.event;

		return (
			<>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css"
				/>
				<SimpleForm<NewEventFormValues & { addPOCbyID: number | null }>
					onChange={this.onEventChange}
					onSubmit={this.onEventSubmit}
					values={{
						...values,
						addPOCbyID: this.state.addPOCbyID,
					}}
					submitInfo={{
						text: this.props.saving
							? 'Saving...'
							: this.props.isEventUpdate
							? 'Update event'
							: 'Create event',
						disabled: this.props.saving,
					}}
					validator={eventValidator}
					disableOnInvalid={true}
					formDisabled={this.props.formDisabled}
				>
					<TextBox>An asterisk (*) denotes a required field</TextBox>
					<TextBox>A tilde (~) deontes Google Calendar publishing</TextBox>
					<TextBox>
						Help is available
						<a
							href="https://github.com/cap-md089/evmplus-guides/wiki/Operator-Guide:-Point-of-Contact"
							target="_blank"
						>
							at this link
						</a>
					</TextBox>

					<Title>Main information</Title>

					<Label>Event Name*~</Label>
					<TextInput name="name" errorMessage="Event must have a name" />

					<Label>Subtitle~</Label>
					<TextInput
						boxStyles={{
							height: '50px',
						}}
						name="subtitle"
					/>

					<Label>Meet date and time*~</Label>
					<DateTimeInput
						name="meetDateTime"
						time={true}
						originalTimeZoneOffset={this.props.registry.Website.Timezone}
					/>

					<Label>Meet location*~</Label>
					<TextInput name="meetLocation" errorMessage="Event must have a meet location" />

					<Label>Start date and time*~</Label>
					<DateTimeInput
						name="startDateTime"
						time={true}
						originalTimeZoneOffset={this.props.registry.Website.Timezone}
						errorMessage="Event cannot start before meeting"
					/>

					<Label>Event location*~</Label>
					<TextInput name="location" errorMessage="Event must have a location" />

					<Label>End date and time*~</Label>
					<DateTimeInput
						name="endDateTime"
						time={true}
						originalTimeZoneOffset={this.props.registry.Website.Timezone}
						errorMessage="Event cannot end before it starts"
					/>

					<Label>Pickup date and time*~</Label>
					<DateTimeInput
						name="pickupDateTime"
						time={true}
						originalTimeZoneOffset={this.props.registry.Website.Timezone}
						errorMessage="Event cannot have a pickup before it ends"
					/>

					<Label>Pickup location*~</Label>
					<TextInput
						name="pickupLocation"
						errorMessage="Event must have a pickup location"
					/>

					<Label>Transportation provided~</Label>
					<Checkbox name="transportationProvided" />

					<Label>
						Transportation description{values.transportationProvided ? '*' : ''}
					</Label>
					<TextInput
						name="transportationDescription"
						errorMessage="Transportation description required if there is transportation provided"
					/>

					<Title>Activity Information</Title>

					<Label>Comments (Visible to the public)~</Label>
					<div className="formbox">
						<textarea ref={this.commentsRef} />
					</div>

					<Label>Member Comments (Visible only when signed in)</Label>
					<div className="formbox">
						<textarea ref={this.mbrcommentsRef} />
					</div>

					<Label>Activity type~</Label>
					<OtherMultCheckbox name="activity" labels={labels.Activities} />

					<Label>Lodging arrangement</Label>
					<OtherMultCheckbox
						name="lodgingArrangments"
						labels={labels.LodgingArrangments}
					/>

					<Label>Event website~</Label>
					<TextInput name="eventWebsite" />

					<Label>High adventure description</Label>
					<TextInput name="highAdventureDescription" />

					<Title>Logistics Information</Title>

					<Label>Senior Member Uniform*~</Label>
					<SimpleMultCheckbox
						name="smuniform"
						labels={labels.SMUniforms}
						errorMessage="Uniform selection is required"
					/>

					<Label>Cadet Uniform*~</Label>
					<SimpleMultCheckbox
						name="cuniform"
						labels={labels.CUniforms}
						errorMessage="Uniform selection is required"
					/>

					<Label>Required participant forms~</Label>
					<OtherMultCheckbox name="requiredForms" labels={labels.RequiredForms} />

					<Label>Required equipment</Label>
					<ListEditor<string, InputProps<string>>
						name="requiredEquipment"
						addNew={() => ''}
						inputComponent={TextInput}
						extraProps={{}}
						errorMessage="Items cannot be empty"
					/>

					<Label>Use registration deadline</Label>
					<Checkbox name="useRegistration" />

					<FormBlock hidden={!values.useRegistration} name="registration">
						<Label>Registration information</Label>
						<TextInput name="information" />

						<Label>Registration deadline</Label>
						<DateTimeInput
							name="deadline"
							time={true}
							originalTimeZoneOffset={this.props.registry.Website.Timezone}
						/>
					</FormBlock>

					<Label>Accept signups</Label>
					<Checkbox name="acceptSignups" />

					<Label>Sign up deny message</Label>
					<TextInput name="signUpDenyMessage" />

					<Label>Send signup email</Label>
					<Checkbox name="useEmailBody" />

					<FormBlock hidden={!values.useEmailBody} name="emailBody">
						<Label>
							Signup Email Message Body
							<br />
							<br />
							Use <code>%%MEMBER_NAME%%</code> to address the member signing up
							directly
							<br />
							Like C/CMSgt John Doe
							<br />
							<br />
							(Click in the editor box to display existing text)
						</Label>
						<TextBox name="body">
							<textarea ref={this.emailBodyRef} />
						</TextBox>
					</FormBlock>

					{/* <Label>Allow signing up part time</Label>
					<Checkbox name="signUpPartTime" /> */}

					<Label>Use participation fee</Label>
					<Checkbox name="useParticipationFee" />

					<FormBlock hidden={!values.useParticipationFee} name="participationFee">
						<Label>Participation fee</Label>
						<NumberInput name="feeAmount" />

						<Label>Participation fee due</Label>
						<DateTimeInput
							name="feeDue"
							time={true}
							originalTimeZoneOffset={this.props.registry.Website.Timezone}
						/>
					</FormBlock>

					<Label>Meals~</Label>
					<OtherMultCheckbox name="mealsDescription" labels={labels.Meals} />

					<Title>Points of Contact</Title>

					{!!this.state.pocAddbyIDError && (
						<TextBox>{this.state.pocAddbyIDError}</TextBox>
					)}
					<NumberInput name="addPOCbyID" />
					<TextBox>
						<Button onClick={this.onAddPOC} disabled={this.state.addingPOCbyID}>
							Add Internal POC by CAPID
						</Button>
					</TextBox>
					<Divider />
					<TextBox />

					<ListEditor<InternalPointOfContactEdit | ExternalPointOfContact, POCInputProps>
						name="pointsOfContact"
						inputComponent={POCInput}
						addNew={() => ({
							type: PointOfContactType.INTERNAL,
							email: '',
							name: '',
							position: '',
							memberReference: Maybe.none(),
							phone: '',
							publicDisplay: true,
							receiveEventUpdates: false,
							receiveRoster: false,
							receiveSignUpUpdates: false,
							receiveUpdates: false,
						})}
						buttonText="Add point of contact"
						removeText="Remove point of contact"
						fullWidth={true}
						extraProps={{
							account: this.props.account,
							member: this.props.member,
							memberList: this.props.memberList,
						}}
					/>

					<Title>Custom Attendance Fields</Title>

					<ListEditor<CustomAttendanceField, InputProps<CustomAttendanceField>>
						name="customAttendanceFields"
						inputComponent={CustomAttendanceFieldInput}
						addNew={() => ({
							type: CustomAttendanceFieldEntryType.TEXT,
							title: '',
							preFill: '',
							displayToMember: false,
							allowMemberToModify: false,
						})}
						buttonText="Add Custom Attendance Field"
						removeText="Remove Custom Attendance Field"
						fullWidth={true}
						extraProps={{}}
					/>

					<Title>File attachments</Title>

					<Label>Event files</Label>
					<FileInput
						name="fileIDs"
						single={true}
						account={this.props.account}
						member={this.props.member}
					/>

					{this.props.account.id === 'volu' && <Title>Academic Requirements</Title>}

					{this.props.account.id === 'volu' && (
						<Label>
							Academic requirement tag (what course does this event satisfy?)
						</Label>
					)}
					{this.props.account.id === 'volu' && (
						<Select name="requirementTag" labels={requirementTagLabels} />
					)}

					<Title>Extra information</Title>

					<Label>Desired number of participants</Label>
					<NumberInput name="desiredNumberOfParticipants" />

					{this.props.account.type === AccountType.CAPSQUADRON ? (
						<Label>Group event number</Label>
					) : null}
					{this.props.account.type === AccountType.CAPSQUADRON ? (
						<RadioButtonWithOther<EchelonEventNumber>
							name="groupEventNumber"
							labels={['Not Required', 'To Be Applied For', 'Applied For']}
						/>
					) : null}

					{/* <Label>Region event number</Label>
					<RadioButtonWithOther<EchelonEventNumber>
						name="regionEventNumber"
						labels={['Not Required', 'To Be Applied For', 'Applied For']}
					/> */}

					<Label>Event status~</Label>
					<EnumRadioButton<EventStatus>
						name="status"
						labels={
							effectiveManageEventPermission(this.props.member) ===
							Permissions.ManageEvent.FULL
								? labels.EventStatusLabels
								: ['Draft']
						}
						values={
							effectiveManageEventPermission(this.props.member) ===
							Permissions.ManageEvent.FULL
								? [
										EventStatus.DRAFT,
										EventStatus.TENTATIVE,
										EventStatus.CONFIRMED,
										EventStatus.COMPLETE,
										EventStatus.CANCELLED,
										EventStatus.INFORMATIONONLY,
								  ]
								: [EventStatus.DRAFT]
						}
						defaultValue={EventStatus.DRAFT}
					/>

					<Label>Entry complete</Label>
					<Checkbox name="complete" />

					<Label>Show upcoming</Label>
					<Checkbox name="showUpcoming" />

					<Label>Administrative comments</Label>
					<BigTextBox name="administrationComments" />

					{process.env.NODE_ENV === 'development' && (
						<>
							<Label>Keep attendance private</Label>
							<Checkbox name="privateAttendance" />
						</>
					)}

					<Title>Team information</Title>

					<TeamSelector teamList={this.props.teamList} name="teamID" />

					<Label>Limit sign ups to team members</Label>
					<Checkbox name="limitSignupsToTeam" />
				</SimpleForm>
			</>
		);
	}

	private onEventChange = (
		event: NewEventFormValues & { addPOCbyID: number | null },
		errors: BooleanForField<NewEventFormValues>,
		changed: BooleanForField<NewEventFormValues>,
		error: boolean,
		fieldChanged: keyof NewEventFormValues | 'addPOCbyID',
	): void => {
		switch (fieldChanged) {
			case 'addPOCbyID':
				this.setState({ addPOCbyID: event.addPOCbyID, pocAddbyIDError: null });
				break;

			/* case 'useEmailBody' :
				break;*/

			default:
				if (!this.props.isEventUpdate) {
					const dateTimesHaveBeenModified =
						changed.startDateTime || changed.endDateTime || changed.pickupDateTime;

					if (!dateTimesHaveBeenModified) {
						event.startDateTime = event.meetDateTime + 900 * 1000; // Fifteen minutes
						event.endDateTime = event.meetDateTime + (900 + 7200) * 1000; // Two hours, 15 minutes
						event.pickupDateTime = event.meetDateTime + (900 + 7200 + 900) * 1000; // Two hours, 30 minutes
					} else if (!changed.pickupDateTime) {
						event.pickupDateTime = event.endDateTime + 900 * 1000; // Fifteen minutes
					}

					const locationsHaveBeenModified = changed.location || changed.pickupLocation;

					if (!locationsHaveBeenModified) {
						event.location = event.meetLocation;
						event.pickupLocation = event.meetLocation;
					}
				}

				this.props.onEventChange(event, !error);
				break;
		}
	};

	private onEventSubmit = (
		mdFreeEvent: NewEventFormValues,
		error: BooleanForField<NewEventFormValues>,
		changed: BooleanForField<NewEventFormValues>,
		hasError: boolean,
	): void => {
		const valid = !hasError;

		// Fix for requiring the subtitle field needing to be changed in order to submit some forms
		// Most likely due to people modifying old events which don't have this field
		const defaultValues = { subtitle: '' };
		const event = {
			...defaultValues,
			...mdFreeEvent,
			comments: this.state.comments?.value() ?? mdFreeEvent.comments,
			memberComments: this.state.memberComments?.value() ?? mdFreeEvent.memberComments,
			emailBody: { body: this.state.emailBody?.value() ?? mdFreeEvent.emailBody.body },
		};

		this.props.onEventFormSubmit(valid ? Maybe.some(event) : Maybe.none());
	};

	private onAddPOC = async (): Promise<void> => {
		if (!this.state.addPOCbyID || this.state.addingPOCbyID) {
			return;
		}

		if (this.state.addPOCbyID <= 100000 || this.state.addPOCbyID >= 999999) {
			this.setState({ pocAddbyIDError: 'Invalid CAPID' });
			return;
		}

		// add duplicate POC check here
		const ref = { type: 'CAPNHQMember' as const, id: this.state.addPOCbyID };
		if (
			this.props.event.pointsOfContact.find(
				poc =>
					poc.type === PointOfContactType.INTERNAL &&
					Maybe.orSome(false)(Maybe.map(areMembersTheSame(ref))(poc.memberReference)),
			)
		) {
			this.setState({ pocAddbyIDError: 'POC Already Present' });
			return;
		}

		this.setState({ addingPOCbyID: true });

		const result = await fetchApi.member.getByID(
			{
				id: stringifyMemberReference({
					type: 'CAPNHQMember' as const,
					id: this.state.addPOCbyID,
				}),
			},
			{},
		);

		if (Either.isLeft(result)) {
			this.setState({
				addPOCbyID: null,
				addingPOCbyID: false,
				pocAddbyIDError: result.value.message,
			});
		} else {
			const event: NewEventFormValues = {
				...this.props.event,
				pointsOfContact: [
					...this.props.event.pointsOfContact,
					{
						type: PointOfContactType.INTERNAL,
						email: Maybe.orSome('')(getMemberEmail(result.value.contact)),
						phone: Maybe.orSome('')(getMemberPhone(result.value.contact)),
						position: '',
						memberReference: Maybe.some(toReference(result.value)),
						receiveEventUpdates: false,
						receiveRoster: false,
						receiveSignUpUpdates: false,
						receiveUpdates: false,
						publicDisplay: false,
					},
				],
			};
			this.props.onEventChange(event, false);
			this.setState({ addingPOCbyID: false, addPOCbyID: null });
		}
	};
}
