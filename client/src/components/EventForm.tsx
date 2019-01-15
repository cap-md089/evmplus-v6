import { DateTime } from 'luxon';
import * as React from 'react';
import Account from 'src/lib/Account';
import MemberBase from 'src/lib/Members';
import SimpleForm, {
	Title,
	Label,
	DateTimeInput,
	MultCheckbox,
	ListEditor,
	RadioButton
} from './SimpleForm';
import {
	TextInput,
	Checkbox,
	FormBlock,
	NumberInput,
	SimpleRadioButton,
	FileInput,
	TeamSelector
} from './Form';
import Registry from 'src/lib/Registry';
import POCInput from './form-inputs/POCInput';
import { PointOfContactType } from '../../../lib';

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
	'Physically Rigorous'
];
export const RequiredForms = [
	'CAP Identification Card',
	'CAPF 31 Application For CAP Encampment Or Special Activity',
	'CAPF 32 Civil Air Patrol Cadet Activity Permission Slip',
	'CAPF 101 Specialty Qualification Card',
	'CAPF 160 CAP Member Health History Form',
	'CAPF 161 Emergency Information',
	'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication'
];
export const Meals = [
	'No meals provided',
	'Meals provided',
	'Bring own food',
	'Bring money'
];
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
	event: NewEventObject;
	isEventUpdate?: boolean;
	account: Account;
	member: MemberBase;
	onEventChange: (event: NewEventObject, valid: boolean) => void;
	onEventFormSubmit: (event: NewEventObject, valid: boolean) => void;
}

interface EventFormState {
	valid: boolean;
	changed: { [P in keyof NewEventObject]: boolean };
	errors: { [P in keyof NewEventObject]: boolean };
}

interface NewEventFormValues extends NewEventObject {
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

export const emptyEvent = (): NewEventObject => ({
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
	uniform: [
		[false, false, true, false, false, false, false, false, false],
		''
	],
	desiredNumberOfParticipants: 8,
	registration: null,
	participationFee: null,
	mealsDescription: [[false, false, false, false, false], ''],
	lodgingArrangments: [[false, false, false, false, false], ''],
	activity: [[false, false, false, false, false, false], ''],
	highAdventureDescription: '',
	requiredEquipment: [],
	eventWebsite: '',
	requiredForms: [
		[true, false, false, false, false, false, false, false],
		''
	],
	comments: '',
	acceptSignups: true,
	signUpDenyMessage: '',
	publishToWingCalendar: false,
	showUpcoming: true,
	groupEventNumber: [0, ''],
	wingEventNumber: [0, ''],
	regionEventNumber: [0, ''],
	complete: false,
	administrationComments: '',
	status: 0,
	debrief: '',
	pointsOfContact: [],
	signUpPartTime: false,
	teamID: null,
	limitSignupsToTeam: false,
	fileIDs: []
});

const convertToFormValues = (event: NewEventObject): NewEventFormValues => ({
	acceptSignups: event.acceptSignups,
	activity: event.activity,
	administrationComments: event.administrationComments,
	comments: event.comments,
	complete: event.complete,
	debrief: event.debrief,
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
	limitSignupsToTeam: event.limitSignupsToTeam
});

const convertFormValuesToEvent = (event: NewEventFormValues) => ({
	acceptSignups: event.acceptSignups,
	activity: event.activity,
	administrationComments: event.administrationComments,
	comments: event.comments,
	complete: event.complete,
	debrief: event.debrief,
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
	publishToWingCalendar: event.publishToWingCalendar,
	regionEventNumber: event.regionEventNumber,
	registration: event.useRegistration ? event.registration : null,
	requiredEquipment: event.requiredEquipment,
	requiredForms: event.requiredForms,
	showUpcoming: event.showUpcoming,
	signUpDenyMessage: event.signUpDenyMessage,
	signUpPartTime: event.signUpPartTime,
	sourceEvent: null,
	startDateTime: event.startDateTime,
	status: event.status,
	teamID:
		event.teamID === null ||
		(event.teamID as any) === '' ||
		event.teamID === undefined
			? null
			: parseInt(event.teamID.toString(), 10),
	limitSignupsToTeam:
		event.teamID === null ||
		(event.teamID as any) === '' ||
		event.teamID === undefined
			? null
			: event.limitSignupsToTeam,
	transportationDescription: event.transportationDescription,
	transportationProvided: event.transportationProvided,
	uniform: event.uniform,
	wingEventNumber: event.wingEventNumber
});

export default class EventForm extends React.Component<
	EventFormProps,
	EventFormState
> {
	public state: EventFormState = {
		valid: false,
		changed: {
			acceptSignups: false,
			activity: false,
			administrationComments: false,
			comments: false,
			complete: false,
			debrief: false,
			desiredNumberOfParticipants: false,
			endDateTime: false,
			eventWebsite: false,
			fileIDs: false,
			groupEventNumber: false,
			highAdventureDescription: false,
			location: false,
			lodgingArrangments: false,
			mealsDescription: false,
			meetDateTime: false,
			meetLocation: false,
			name: false,
			participationFee: false,
			pickupDateTime: false,
			pickupLocation: false,
			pointsOfContact: false,
			publishToWingCalendar: false,
			regionEventNumber: false,
			registration: false,
			requiredEquipment: false,
			requiredForms: false,
			showUpcoming: false,
			signUpDenyMessage: false,
			signUpPartTime: false,
			startDateTime: false,
			status: false,
			teamID: false,
			limitSignupsToTeam: false,
			transportationDescription: false,
			transportationProvided: false,
			uniform: false,
			wingEventNumber: false
		},
		errors: {
			acceptSignups: false,
			activity: false,
			administrationComments: false,
			comments: false,
			complete: false,
			debrief: false,
			desiredNumberOfParticipants: false,
			endDateTime: false,
			eventWebsite: false,
			fileIDs: false,
			groupEventNumber: false,
			highAdventureDescription: false,
			location: false,
			lodgingArrangments: false,
			mealsDescription: false,
			meetDateTime: false,
			meetLocation: false,
			name: false,
			participationFee: false,
			pickupDateTime: false,
			pickupLocation: false,
			pointsOfContact: false,
			publishToWingCalendar: false,
			regionEventNumber: false,
			registration: false,
			requiredEquipment: false,
			requiredForms: false,
			showUpcoming: false,
			signUpDenyMessage: false,
			signUpPartTime: false,
			startDateTime: false,
			status: false,
			teamID: false,
			limitSignupsToTeam: false,
			transportationDescription: false,
			transportationProvided: false,
			uniform: false,
			wingEventNumber: false
		}
	};

	public constructor(props: EventFormProps) {
		super(props);

		this.onEventChange = this.onEventChange.bind(this);
		this.onEventSubmit = this.onEventSubmit.bind(this);
	}

	public render() {
		const values = convertToFormValues(this.props.event);

		return (
			<SimpleForm<NewEventFormValues>
				onChange={this.onEventChange}
				onSubmit={this.onEventSubmit}
				values={values}
				submitInfo={{
					text: this.props.isEventUpdate
						? 'Update event'
						: 'Create event',
					disabled: !this.state.valid
				}}
			>
				<Title>Main information</Title>

				<Label>Event Name</Label>
				<TextInput name="name" />

				<Label>Meet date and time</Label>
				<DateTimeInput
					name="meetDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>

				<Label>Meet location</Label>
				<TextInput name="meetLocation" />

				<Label>Start date and time</Label>
				<DateTimeInput
					name="startDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.startDateTimeInputChange}
				/>

				<Label>Event location</Label>
				<TextInput
					name="location"
					onChange={this.eventLocationInputChange}
				/>

				<Label>End date and time</Label>
				<DateTimeInput
					name="endDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.endDateTimeInputChange}
				/>

				<Label>Pickup date and time</Label>
				<DateTimeInput
					name="pickupDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.pickupDateTimeInputChange}
				/>

				<Label>Pickup location</Label>
				<TextInput
					name="pickupLocation"
					onChange={this.pickupLocationInputChange}
				/>

				<Label>Transportation provided</Label>
				<Checkbox name="transportationProvided" />

				<Label>Transportation description</Label>
				<TextInput name="transportationDescription" />

				<Title>Activity Information</Title>

				<Label>Comments</Label>
				<TextInput
					boxStyles={{
						height: '50px'
					}}
					name="comments"
				/>

				<Label>Activity type</Label>
				<MultCheckbox
					name="activity"
					labels={[
						'Squadron Meeting',
						'Classroom/Tour/Light',
						'Backcountry',
						'Flying',
						'Physically Rigorous'
					]}
					other={true}
				/>

				<Label>Lodging arrangement</Label>
				<MultCheckbox
					name="lodgingArrangments"
					labels={LodgingArrangments}
					other={true}
				/>

				<Label>Event website</Label>
				<TextInput name="eventWebsite" />

				<Label>High adventure decsription</Label>
				<TextInput name="highAdventureDescription" />

				<Title>Logistics Information</Title>

				<Label>Uniform</Label>
				<MultCheckbox name="uniform" labels={Uniforms} />

				<Label>Required forms</Label>
				<MultCheckbox
					name="requiredForms"
					labels={RequiredForms}
					other={true}
				/>

				<Label>Required equipment</Label>
				<ListEditor<string>
					name="requiredEquipment"
					addNew={() => ''}
					inputComponent={TextInput}
				/>

				<Label>Use registration deadline</Label>
				<Checkbox name="useRegistration" />

				<FormBlock
					style={{
						display: values.useRegistration ? 'block' : 'none'
					}}
					name="registration"
				>
					<Label>Registration information</Label>
					<TextInput name="information" />

					<Label>Registration deadline</Label>
					<DateTimeInput
						name="deadline"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
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

				<FormBlock
					style={{
						display: values.useParticipationFee ? 'block' : 'none'
					}}
					name="participationFee"
				>
					<Label>Participation fee</Label>
					<NumberInput name="feeAmount" />

					<Label>Participation fee due</Label>
					<DateTimeInput
						name="feeDue"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				</FormBlock>

				<Label>Meals</Label>
				<MultCheckbox
					name="mealsDescription"
					labels={Meals}
					other={true}
				/>

				<Title>Point of Contact</Title>

				<ListEditor<
					DisplayInternalPointOfContact | ExternalPointOfContact
				>
					name="pointsOfContact"
					inputComponent={POCInput}
					account={this.props.account}
					member={this.props.member}
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
				/>

				<Title>Extra information</Title>

				<Label>Desired number of participants</Label>
				<NumberInput name="desiredNumberOfParticipants" />

				<Label>Group event number</Label>
				<RadioButton
					name="groupEventNumber"
					labels={[
						'Not Required',
						'To Be Applied For',
						'Applied For'
					]}
					other={true}
				/>

				<Label>Wing event number</Label>
				<RadioButton
					name="wingEventNumber"
					labels={[
						'Not Required',
						'To Be Applied For',
						'Applied For'
					]}
					other={true}
				/>

				<Label>Region event number</Label>
				<RadioButton
					name="regionEventNumber"
					labels={[
						'Not Required',
						'To Be Applied For',
						'Applied For'
					]}
					other={true}
				/>

				<Label>Event status</Label>
				<SimpleRadioButton name="status" labels={EventStatus} />

				<Label>Entry complete</Label>
				<Checkbox name="complete" />

				<Label>Publish to wing</Label>
				<Checkbox name="publishToWingCalendar" />

				<Label>Show upcoming</Label>
				<Checkbox name="showUpcoming" />

				<Label>Administration comments</Label>
				<TextInput name="administrationComments" />

				<Label>Event files</Label>
				<FileInput
					name="fileIDs"
					account={this.props.account}
					member={this.props.member}
				/>

				<Title>Team information</Title>

				<Label />

				<TeamSelector
					account={this.props.account}
					member={this.props.member}
					name="teamID"
				/>

				<Label>Limit sign ups to team members</Label>
				<Checkbox name="limitSignupsToTeam" />

				<Title>Debrief information</Title>

				<Label>Debrief</Label>
				<TextInput name="debrief" />
			</SimpleForm>
		);
	}

	private onEventChange(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

		if (!this.props.isEventUpdate) {
			const dateTimesHaveBeenModified =
				this.state.changed.startDateTime ||
				this.state.changed.endDateTime ||
				this.state.changed.pickupDateTime;

			if (!dateTimesHaveBeenModified) {
				event.startDateTime = event.meetDateTime + 300 * 1000; // Five minutes
				event.endDateTime = event.meetDateTime + (300 + 3600) * 1000; // 65 minutes
				event.pickupDateTime =
					event.meetDateTime + (300 + 3600 + 300) * 1000; // 70 minutes
			} else if (!this.state.changed.pickupDateTime) {
				event.pickupDateTime = event.endDateTime + 300 * 1000; // Five minutes
			}

			const locationsHaveBeenModified =
				this.state.changed.location ||
				this.state.changed.pickupLocation;

			if (!locationsHaveBeenModified) {
				event.location = event.meetLocation;
				event.pickupLocation = event.meetLocation;
			}
		}

		this.setState({
			valid
		});

		this.props.onEventChange(convertFormValuesToEvent(event), valid);
	}

	private onEventSubmit(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

		if (!this.props.isEventUpdate) {
			const dateTimesHaveBeenModified =
				this.state.changed.startDateTime ||
				this.state.changed.endDateTime ||
				this.state.changed.pickupDateTime;

			if (!dateTimesHaveBeenModified) {
				event.startDateTime = event.meetDateTime + 300 * 1000; // Five minutes
				event.endDateTime = event.meetDateTime + (300 + 3600) * 1000; // 65 minutes
				event.pickupDateTime =
					event.meetDateTime + (300 + 3600 + 300) * 1000; // 70 minutes
			} else if (!this.state.changed.pickupDateTime) {
				event.pickupDateTime = event.endDateTime + 300 * 1000; // Five minutes
			}

			const locationsHaveBeenModified =
				this.state.changed.location ||
				this.state.changed.pickupLocation;

			if (!locationsHaveBeenModified) {
				event.location = event.meetLocation;
				event.pickupLocation = event.meetLocation;
			}
		}

		this.setState({
			valid
		});

		this.props.onEventFormSubmit(convertFormValuesToEvent(event), valid);
	}

	private checkIfValid(event: NewEventFormValues): boolean {
		let valid = true;

		if (event.meetDateTime >= event.startDateTime) {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					meetDateTime: true
				}
			}));
			valid = false;
		}

		if (event.startDateTime >= event.endDateTime) {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					startDateTime: true
				}
			}));
			valid = false;
		}

		if (event.endDateTime >= event.pickupDateTime) {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					endDateTime: true
				}
			}));
			valid = false;
		}

		if (event.name === '') {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					name: true
				}
			}));
			valid = false;
		}

		if (event.meetLocation === '') {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					meetLocation: true
				}
			}));
			valid = false;
		}

		if (event.location === '') {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					location: true
				}
			}));
			valid = false;
		}

		if (event.pickupLocation === '') {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					pickupLocation: true
				}
			}));
			valid = false;
		}

		if (
			event.transportationProvided === true &&
			event.transportationDescription === ''
		) {
			this.setState(prev => ({
				errors: {
					...prev.errors,
					transportationDescription: true
				}
			}));
			valid = false;
		}

		return valid;
	}

	private startDateTimeInputChange() {
		this.setState(prev => ({
			changed: {
				...prev.changed,
				startDateTime: true
			}
		}));
	}

	private endDateTimeInputChange() {
		this.setState(prev => ({
			changed: {
				...prev.changed,
				endDateTime: true
			}
		}));
	}

	private pickupDateTimeInputChange() {
		this.setState(prev => ({
			changed: {
				...prev.changed,
				pickupDateTime: true
			}
		}));
	}

	private eventLocationInputChange() {
		this.setState(prev => ({
			changed: {
				...prev.changed,
				location: true
			}
		}));
	}

	private pickupLocationInputChange() {
		this.setState(prev => ({
			changed: {
				...prev.changed,
				pickupLocation: true
			}
		}));
	}
}
