import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	defaultRadioFromLabels,
	DisplayInternalPointOfContact,
	EchelonEventNumber,
	emptyFromLabels,
	emptySimpleFromLabels,
	EventStatus as EventStatusEnum,
	ExternalPointOfContact,
	InternalPointOfContact,
	NewEventObject,
	OtherMultCheckboxReturn,
	PointOfContactType,
	RadioReturnWithOther,
	SimpleMultCheckboxReturn,
	isOneOfSelected
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import Account from '../../../lib/Account';
import MemberBase, { CAPMemberClasses } from '../../../lib/Members';
import Registry from '../../../lib/Registry';
import Team from '../../../lib/Team';
import CustomAttendanceFieldInput from '../../form-inputs/CustomAttendanceFieldInput';
import { InputProps } from '../../form-inputs/Input';
import POCInput, { POCInputProps } from '../../form-inputs/POCInput';
import SimpleMultCheckbox from '../../form-inputs/SimpleMultCheckbox';
import SimpleForm, {
	Checkbox,
	DateTimeInput,
	FileInput,
	FormBlock,
	Label,
	ListEditor,
	NumberInput,
	OtherMultCheckbox,
	RadioButtonWithOther,
	SimpleRadioButton,
	TeamSelector,
	TextInput,
	Title,
	FormValidator,
	TextBox
} from '../SimpleForm';
import { BooleanForField } from '../../form-inputs/FormBlock';

export const Uniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Battle Dress Uniform or Airman Battle Uniform (BDU/ABU)',
	'PT Gear',
	'Polo Shirts (Senior Members)',
	'Blue Utilities (Senior Members)',
	'Civilian Attire',
	'Flight Suit',
	'Not Applicable'
];
export const Activities = [
	'Squadron Meeting',
	'Classroom/Tour/Light',
	'Backcountry',
	'Flying',
	'Physically Rigorous',
	'Recurring Meeting'
];
export const RequiredForms = [
	'CAP Identification Card',
	'CAPF 31 Application For CAP Encampment Or Special Activity',
	'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
	'CAPF 101 Specialty Qualification Card',
	'CAPF 160 CAP Member Health History Form',
	'CAPF 161 Emergency Information',
	'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication'
];
export const Meals = ['No meals provided', 'Meals provided', 'Bring own food', 'Bring money'];
export const LodgingArrangments = [
	'Hotel or individual room',
	'Open bay building',
	'Large tent',
	'Individual tent'
];
export const EventStatus = [
	'Draft',
	'Tentative',
	'Confirmed',
	'Complete',
	'Cancelled',
	'Information Only'
];

interface EventFormProps {
	registry: Registry;
	event: NewEventFormValues;
	isEventUpdate?: boolean;
	account: Account;
	member: MemberBase;
	teamList: Promise<Team[]>;
	memberList: Promise<CAPMemberClasses[]>;
	onEventChange: (event: NewEventFormValues, valid: boolean) => void;
	onEventFormSubmit: (event: NewEventFormValues, valid: boolean) => void;
	saving: boolean;
}

export interface NewEventFormValues {
	name: string;
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
	acceptSignups: boolean;
	signUpDenyMessage: null | string;
	publishToWingCalendar: boolean;
	showUpcoming: boolean;
	complete: boolean;
	administrationComments: string;
	status: EventStatusEnum;
	pointsOfContact: Array<InternalPointOfContact | ExternalPointOfContact>;
	customAttendanceFields: CustomAttendanceField[];
	signUpPartTime: boolean;
	uniform: SimpleMultCheckboxReturn;
	mealsDescription: OtherMultCheckboxReturn;
	lodgingArrangments: OtherMultCheckboxReturn;
	activity: OtherMultCheckboxReturn;
	requiredForms: OtherMultCheckboxReturn;
	teamID: number | null;
	limitSignupsToTeam: boolean | null;
	fileIDs: string[];
	privateAttendance: boolean;
	groupEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	wingEventNumber: RadioReturnWithOther<EchelonEventNumber>;
	regionEventNumber: RadioReturnWithOther<EchelonEventNumber>;

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
}

export const convertFormValuesToEvent = (event: NewEventFormValues): NewEventObject => {
	return {
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
		name: event.name,
		participationFee: event.useParticipationFee ? event.participationFee : null,
		pickupDateTime: event.pickupDateTime,
		pickupLocation: event.pickupLocation,
		pointsOfContact: event.pointsOfContact,
		customAttendanceFields: event.customAttendanceFields,
		publishToWingCalendar: event.publishToWingCalendar,
		regionEventNumber: event.regionEventNumber,
		registration: event.useRegistration ? event.registration : null,
		requiredEquipment: event.requiredEquipment,
		requiredForms: event.requiredForms,
		showUpcoming: event.showUpcoming,
		signUpDenyMessage: event.signUpDenyMessage,
		signUpPartTime: event.signUpPartTime,
		startDateTime: event.startDateTime,
		status: event.status,
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
		uniform: event.uniform,
		wingEventNumber: event.wingEventNumber,
		privateAttendance: event.privateAttendance
	};
};

export const emptyEventFormValues = (): NewEventFormValues => ({
	name: '',
	meetDateTime: +DateTime.utc(),
	meetLocation: '',
	startDateTime: +DateTime.utc(),
	location: '',
	endDateTime: +DateTime.utc(),
	pickupDateTime: +DateTime.utc(),
	pickupLocation: '',
	transportationProvided: false,
	transportationDescription: '',
	uniform: emptySimpleFromLabels(Uniforms),
	desiredNumberOfParticipants: 8,
	useRegistration: false,
	registration: {
		deadline: Date.now(),
		information: ''
	},
	useParticipationFee: false,
	participationFee: {
		feeAmount: 0,
		feeDue: Date.now()
	},
	mealsDescription: emptyFromLabels(Meals),
	lodgingArrangments: emptyFromLabels(LodgingArrangments),
	activity: emptyFromLabels(Activities),
	highAdventureDescription: '',
	requiredEquipment: [],
	eventWebsite: '',
	requiredForms: emptyFromLabels(RequiredForms),
	comments: '',
	acceptSignups: true,
	signUpDenyMessage: '',
	publishToWingCalendar: false,
	showUpcoming: true,
	groupEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	wingEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	regionEventNumber: defaultRadioFromLabels(['Not Required', 'To Be Applied For', 'Applied For']),
	complete: false,
	administrationComments: '',
	status: 0,
	pointsOfContact: [],
	customAttendanceFields: [],
	signUpPartTime: false,
	teamID: null,
	limitSignupsToTeam: false,
	fileIDs: [],
	privateAttendance: false
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
	name: event.name,
	participationFee: event.participationFee || {
		feeAmount: 0,
		feeDue: Date.now()
	},
	useParticipationFee: !!event.participationFee,
	pickupDateTime: event.pickupDateTime,
	pickupLocation: event.pickupLocation,
	pointsOfContact: event.pointsOfContact,
	customAttendanceFields: event.customAttendanceFields,
	publishToWingCalendar: event.publishToWingCalendar,
	regionEventNumber: event.regionEventNumber,
	registration: event.registration || {
		deadline: Date.now(),
		information: ''
	},
	useRegistration: !!event.registration,
	requiredEquipment: event.requiredEquipment,
	requiredForms: event.requiredForms,
	showUpcoming: event.showUpcoming,
	signUpDenyMessage: event.signUpDenyMessage,
	signUpPartTime: event.signUpPartTime,
	startDateTime: event.startDateTime,
	status: event.status,
	teamID: event.teamID,
	transportationDescription: event.transportationDescription,
	transportationProvided: event.transportationProvided,
	uniform: event.uniform,
	wingEventNumber: event.wingEventNumber,
	limitSignupsToTeam: event.limitSignupsToTeam,
	privateAttendance: event.privateAttendance
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
	uniform: isOneOfSelected,
	requiredEquipment: equipment =>
		equipment.map(s => !!s).reduce((prev, curr) => prev && curr, true)
};

export default class EventForm extends React.Component<EventFormProps> {
	public constructor(props: EventFormProps) {
		super(props);

		this.onEventChange = this.onEventChange.bind(this);
		this.onEventSubmit = this.onEventSubmit.bind(this);
	}

	public render() {
		const values = this.props.event;

		return (
			<SimpleForm<NewEventFormValues>
				onChange={this.onEventChange}
				onSubmit={this.onEventSubmit}
				values={values}
				submitInfo={{
					text: this.props.saving
						? 'Saving...'
						: this.props.isEventUpdate
						? 'Update event'
						: 'Create event',
					disabled: this.props.saving
				}}
				validator={eventValidator}
				disableOnInvalid={true}
			>
				<TextBox>An asterisk (*) denotes a required field</TextBox>

				<Title>Main information</Title>

				<Label>Event Name*</Label>
				<TextInput name="name" errorMessage="Event must have a name" />

				<Label>Meet date and time*</Label>
				<DateTimeInput
					name="meetDateTime"
					time={true}
					originalTimeZoneOffset={this.props.registry.Website.Timezone}
				/>

				<Label>Meet location*</Label>
				<TextInput name="meetLocation" errorMessage="Event must have a meet location" />

				<Label>Start date and time*</Label>
				<DateTimeInput
					name="startDateTime"
					time={true}
					originalTimeZoneOffset={this.props.registry.Website.Timezone}
					errorMessage="Event cannot start before meeting"
				/>

				<Label>Event location*</Label>
				<TextInput name="location" errorMessage="Event must have a location" />

				<Label>End date and time*</Label>
				<DateTimeInput
					name="endDateTime"
					time={true}
					originalTimeZoneOffset={this.props.registry.Website.Timezone}
					errorMessage="Event cannot end before it starts"
				/>

				<Label>Pickup date and time*</Label>
				<DateTimeInput
					name="pickupDateTime"
					time={true}
					originalTimeZoneOffset={this.props.registry.Website.Timezone}
					errorMessage="Event cannot have a pickup before it ends"
				/>

				<Label>Pickup location*</Label>
				<TextInput name="pickupLocation" errorMessage="Event must have a pickup location" />

				<Label>Transportation provided</Label>
				<Checkbox name="transportationProvided" />

				<Label>Transportation description</Label>
				<TextInput
					name="transportationDescription"
					errorMessage="Transportation description required if there is transportation provided"
				/>

				<Title>Activity Information</Title>

				<Label>Comments</Label>
				<TextInput
					boxStyles={{
						height: '50px'
					}}
					name="comments"
				/>

				<Label>Activity type</Label>
				<OtherMultCheckbox name="activity" labels={Activities} />

				<Label>Lodging arrangement</Label>
				<OtherMultCheckbox name="lodgingArrangments" labels={LodgingArrangments} />

				<Label>Event website</Label>
				<TextInput name="eventWebsite" />

				<Label>High adventure description</Label>
				<TextInput name="highAdventureDescription" />

				<Title>Logistics Information</Title>

				<Label>Uniform*</Label>
				<SimpleMultCheckbox
					name="uniform"
					labels={Uniforms}
					errorMessage="Uniform selection is required"
				/>

				<Label>Required forms</Label>
				<OtherMultCheckbox name="requiredForms" labels={RequiredForms} />

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

				<Label>Allow signing up part time</Label>
				<Checkbox name="signUpPartTime" />

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

				<Label>Meals</Label>
				<OtherMultCheckbox name="mealsDescription" labels={Meals} />

				<Title>Points of Contact</Title>

				<ListEditor<DisplayInternalPointOfContact | ExternalPointOfContact, POCInputProps>
					name="pointsOfContact"
					inputComponent={POCInput}
					addNew={() => ({
						type: PointOfContactType.INTERNAL,
						email: '',
						name: '',
						memberReference: {
							type: 'Null'
						},
						phone: '',
						receiveEventUpdates: false,
						receiveRoster: false,
						receiveSignUpUpdates: false,
						receiveUpdates: false
					})}
					buttonText="Add point of contact"
					fullWidth={true}
					extraProps={{
						account: this.props.account,
						member: this.props.member,
						memberList: this.props.memberList
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
						allowMemberToModify: false
					})}
					buttonText="Add Custom Attendance Field"
					fullWidth={true}
					extraProps={{}}
				/>

				<Title>Extra information</Title>

				<Label>Desired number of participants</Label>
				<NumberInput name="desiredNumberOfParticipants" />

				<Label>Group event number</Label>
				<RadioButtonWithOther<EchelonEventNumber>
					name="groupEventNumber"
					labels={['Not Required', 'To Be Applied For', 'Applied For']}
				/>

				<Label>Wing event number</Label>
				<RadioButtonWithOther<EchelonEventNumber>
					name="wingEventNumber"
					labels={['Not Required', 'To Be Applied For', 'Applied For']}
				/>

				<Label>Region event number</Label>
				<RadioButtonWithOther<EchelonEventNumber>
					name="regionEventNumber"
					labels={['Not Required', 'To Be Applied For', 'Applied For']}
				/>

				<Label>Event status</Label>
				<SimpleRadioButton
					name="status"
					labels={
						this.props.member.hasPermission('ManageEvent', 2) ? EventStatus : ['Draft']
					}
				/>

				<Label>Entry complete</Label>
				<Checkbox name="complete" />

				<Label>Publish to wing</Label>
				<Checkbox name="publishToWingCalendar" />

				<Label>Show upcoming</Label>
				<Checkbox name="showUpcoming" />

				<Label>Administration comments</Label>
				<TextInput name="administrationComments" />

				<Label>Event files</Label>
				<FileInput name="fileIDs" account={this.props.account} member={this.props.member} />

				<Label>Keep attendance private</Label>
				<Checkbox name="privateAttendance" />

				<Title>Team information</Title>

				<TeamSelector teamList={this.props.teamList} name="teamID" />

				<Label>Limit sign ups to team members</Label>
				<Checkbox name="limitSignupsToTeam" />
			</SimpleForm>
		);
	}

	private onEventChange(
		event: NewEventFormValues,
		errors: BooleanForField<NewEventFormValues>,
		changed: BooleanForField<NewEventFormValues>,
		error: boolean
	) {
		if (!this.props.isEventUpdate) {
			const dateTimesHaveBeenModified =
				changed.startDateTime || changed.endDateTime || changed.pickupDateTime;

			if (!dateTimesHaveBeenModified) {
				event.startDateTime = event.meetDateTime + 900 * 1000; // Fifteen minutes
				event.endDateTime = event.meetDateTime + (900 + 3600) * 1000; // 75 minutes
				event.pickupDateTime = event.meetDateTime + (900 + 3600 + 900) * 1000; // 90 minutes
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
	}

	private onEventSubmit(
		event: NewEventFormValues,
		error: BooleanForField<NewEventFormValues>,
		changed: BooleanForField<NewEventFormValues>,
		hasError: boolean
	) {
		const valid = !hasError;

		// if (!this.props.isEventUpdate) {
		// 	const dateTimesHaveBeenModified =
		// 		this.state.changed.startDateTime ||
		// 		this.state.changed.endDateTime ||
		// 		this.state.changed.pickupDateTime;

		// 	if (!dateTimesHaveBeenModified) {
		// 		event.startDateTime = event.meetDateTime + 900 * 1000; // Fifteen minutes
		// 		event.endDateTime = event.meetDateTime + (900 + 3600) * 1000; // 75 minutes
		// 		event.pickupDateTime = event.meetDateTime + (900 + 3600 + 900) * 1000; // 90 minutes
		// 	} else if (!this.state.changed.pickupDateTime) {
		// 		event.pickupDateTime = event.endDateTime + 900 * 1000; // Fifteen minutes
		// 	}

		// 	const locationsHaveBeenModified =
		// 		this.state.changed.location || this.state.changed.pickupLocation;

		// 	if (!locationsHaveBeenModified) {
		// 		event.location = event.meetLocation;
		// 		event.pickupLocation = event.meetLocation;
		// 	}
		// }

		this.setState({
			valid
		});

		this.props.onEventFormSubmit(event, valid);
	}
}
