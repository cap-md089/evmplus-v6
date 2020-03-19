import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	DisplayInternalPointOfContact,
	ExternalPointOfContact,
	NewEventObject,
	just,
	none,
	PointOfContactType,
	OtherMultCheckboxReturn,
	EventStatus as EventStatusEnum,
	InternalPointOfContact,
	RadioReturnWithOther,
	EchelonEventNumber,
	emptyFromLabels,
	Maybe
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
import SimpleForm, {
	Checkbox,
	DateTimeInput,
	FileInput,
	FormBlock,
	Label,
	ListEditor,
	OtherMultCheckbox,
	NumberInput,
	SimpleRadioButton,
	TeamSelector,
	TextInput,
	Title,
	RadioButtonWithOther
} from '../SimpleForm';

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
}

interface EventFormState {
	valid: boolean;
	changed: { [P in keyof NewEventObject]: boolean };
	errors: { [P in keyof NewEventObject]: boolean };
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
	uniform: OtherMultCheckboxReturn;
	mealsDescription: OtherMultCheckboxReturn;
	lodgingArrangments: OtherMultCheckboxReturn;
	activity: OtherMultCheckboxReturn;
	requiredForms: OtherMultCheckboxReturn;
	teamID: number | null;
	limitSignupsToTeam: boolean | null;
	fileIDs: string[];
	privateAttendance: boolean;

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

	groupEventNumber: Maybe<RadioReturnWithOther<EchelonEventNumber>>;
	wingEventNumber: Maybe<RadioReturnWithOther<EchelonEventNumber>>;
	regionEventNumber: Maybe<RadioReturnWithOther<EchelonEventNumber>>;
}

export const convertFormValuesToEvent = (event: NewEventFormValues): NewEventObject => {
	if (
		event.groupEventNumber.isNone() ||
		event.wingEventNumber.isNone() ||
		event.regionEventNumber.isNone()
	) {
		throw new Error('Form is not complete');
	}

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
		groupEventNumber: event.groupEventNumber.some(),
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
		regionEventNumber: event.regionEventNumber.some(),
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
		wingEventNumber: event.wingEventNumber.some(),
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
	uniform: emptyFromLabels(Uniforms),
	desiredNumberOfParticipants: 8,
	useRegistration: false,
	registration: {
		deadline: 0,
		information: ''
	},
	useParticipationFee: false,
	participationFee: {
		feeAmount: 0,
		feeDue: 0
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
	groupEventNumber: none(),
	wingEventNumber: none(),
	regionEventNumber: none(),
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
	groupEventNumber: just(event.groupEventNumber),
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
	regionEventNumber: just(event.regionEventNumber),
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
	wingEventNumber: just(event.wingEventNumber),
	limitSignupsToTeam: event.limitSignupsToTeam,
	privateAttendance: event.privateAttendance
});

export default class EventForm extends React.Component<EventFormProps, EventFormState> {
	public state: EventFormState = {
		valid: false,
		changed: {
			acceptSignups: false,
			activity: false,
			administrationComments: false,
			comments: false,
			complete: false,
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
			customAttendanceFields: false,
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
			wingEventNumber: false,
			privateAttendance: false
		},
		errors: {
			acceptSignups: false,
			activity: false,
			administrationComments: false,
			comments: false,
			complete: false,
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
			customAttendanceFields: false,
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
			wingEventNumber: false,
			privateAttendance: false
		}
	};

	public constructor(props: EventFormProps) {
		super(props);

		this.onEventChange = this.onEventChange.bind(this);
		this.onEventSubmit = this.onEventSubmit.bind(this);

		this.endDateTimeInputChange = this.endDateTimeInputChange.bind(this);
		this.eventLocationInputChange = this.eventLocationInputChange.bind(this);
		this.startDateTimeInputChange = this.startDateTimeInputChange.bind(this);
		this.pickupDateTimeInputChange = this.pickupDateTimeInputChange.bind(this);
		this.pickupLocationInputChange = this.pickupLocationInputChange.bind(this);
	}

	public render() {
		const values = this.props.event;

		return (
			<SimpleForm<NewEventFormValues>
				onChange={this.onEventChange}
				onSubmit={this.onEventSubmit}
				values={values}
				submitInfo={{
					text: this.props.isEventUpdate ? 'Update event' : 'Create event',
					disabled: !this.state.valid
				}}
			>
				<Title>Main information</Title>

				<Label>Event Name</Label>
				<TextInput name="name" />

				<Label>Meet date and time</Label>
				<DateTimeInput
					name="meetDateTime"
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>

				<Label>Meet location</Label>
				<TextInput name="meetLocation" />

				<Label>Start date and time</Label>
				<DateTimeInput
					name="startDateTime"
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.startDateTimeInputChange}
				/>

				<Label>Event location</Label>
				<TextInput name="location" onChange={this.eventLocationInputChange} />

				<Label>End date and time</Label>
				<DateTimeInput
					name="endDateTime"
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.endDateTimeInputChange}
				/>

				<Label>Pickup date and time</Label>
				<DateTimeInput
					name="pickupDateTime"
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={this.pickupDateTimeInputChange}
				/>

				<Label>Pickup location</Label>
				<TextInput name="pickupLocation" onChange={this.pickupLocationInputChange} />

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
				<OtherMultCheckbox name="activity" labels={Activities} />

				<Label>Lodging arrangement</Label>
				<OtherMultCheckbox name="lodgingArrangments" labels={LodgingArrangments} />

				<Label>Event website</Label>
				<TextInput name="eventWebsite" />

				<Label>High adventure description</Label>
				<TextInput name="highAdventureDescription" />

				<Title>Logistics Information</Title>

				<Label>Uniform</Label>
				<OtherMultCheckbox name="uniform" labels={Uniforms} />

				<Label>Required forms</Label>
				<OtherMultCheckbox name="requiredForms" labels={RequiredForms} />

				<Label>Required equipment</Label>
				<ListEditor<string, InputProps<string>>
					name="requiredEquipment"
					addNew={() => ''}
					inputComponent={TextInput}
					extraProps={{}}
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

				<FormBlock hidden={!values.useParticipationFee} name="participationFee">
					<Label>Participation fee</Label>
					<NumberInput name="feeAmount" />

					<Label>Participation fee due</Label>
					<DateTimeInput
						name="feeDue"
						time={true}
						originalTimeZoneOffset={'America/New_York'}
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

	private onEventChange(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

		if (!this.props.isEventUpdate) {
			const dateTimesHaveBeenModified =
				this.state.changed.startDateTime ||
				this.state.changed.endDateTime ||
				this.state.changed.pickupDateTime;

			if (!dateTimesHaveBeenModified) {
				event.startDateTime = event.meetDateTime + 900 * 1000; // Fifteen minutes
				event.endDateTime = event.meetDateTime + (900 + 3600) * 1000; // 75 minutes
				event.pickupDateTime = event.meetDateTime + (900 + 3600 + 900) * 1000; // 90 minutes
			} else if (!this.state.changed.pickupDateTime) {
				event.pickupDateTime = event.endDateTime + 900 * 1000; // Fifteen minutes
			}

			const locationsHaveBeenModified =
				this.state.changed.location || this.state.changed.pickupLocation;

			if (!locationsHaveBeenModified) {
				event.location = event.meetLocation;
				event.pickupLocation = event.meetLocation;
			}
		}

		this.setState({
			valid
		});

		this.props.onEventChange(event, valid);
	}

	private onEventSubmit(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

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

		if (event.transportationProvided === true && event.transportationDescription === '') {
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
