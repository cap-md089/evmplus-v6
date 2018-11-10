import { DateTime } from 'luxon';
import * as React from 'react';
import {
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	ListEditor,
	MultCheckbox,
	NumberInput,
	RadioButton,
	SimpleRadioButton,
	TextInput,
	Title
} from '../components/Form';
import POCInput from '../components/form-inputs/POCInput';
import { FileInput, TextBox } from '../components/SimpleForm';
import SimpleRequestForm from '../components/SimpleRequestForm';
import { PageProps } from './Page';

const PointOfContactType = { INTERNAL: 0, EXTERNAL: 1 };

interface AddEventState {
	event: NewEventFormValues;
	valid: boolean;
	errors: {};
	changed: { [P in keyof NewEventFormValues]: boolean };
}

interface NewEventFormValues extends NewEventObject {
	useRegistration: boolean;
	registration: {
		deadline: number;
		information: string;
	};
	useParticipationFee: boolean;
	participationFee: {
		feeDue: number;
		feeAmount: number;
	};
}

export default class AddEvent extends React.Component<
	PageProps,
	AddEventState
> {
	public state: AddEventState = {
		event: {
			name: '',
			meetDateTime: Math.round(+DateTime.utc() / 1000),
			meetLocation: '',
			startDateTime: Math.round(+DateTime.utc() / 1000) + 300,
			location: '',
			endDateTime: Math.round(+DateTime.utc() / 1000) + 3900,
			pickupDateTime: Math.round(+DateTime.utc() / 1000) + 4200,
			pickupLocation: '',
			transportationProvided: false,
			transportationDescription: '',
			uniform: [
				[false, false, true, false, false, false, false, false, false],
				''
			],
			desiredNumberOfParticipants: 8,
			useRegistration: false,
			registration: {
				deadline: Math.round(+DateTime.utc() / 1000),
				information: ''
			},
			useParticipationFee: false,
			participationFee: {
				feeAmount: 0,
				feeDue: Math.round(+DateTime.utc() / 1000)
			},
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
			wingEventNumber: 0,
			complete: false,
			administrationComments: '',
			status: [0, ''],
			debrief: '',
			pointsOfContact: [],
			signUpPartTime: false,
			teamID: 0,
			fileIDs: [],
			sourceEvent: null
		},
		valid: false,
		errors: {},
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
			registration: false,
			requiredEquipment: false,
			requiredForms: false,
			showUpcoming: false,
			signUpDenyMessage: false,
			signUpPartTime: false,
			sourceEvent: false,
			startDateTime: false,
			status: false,
			teamID: false,
			transportationDescription: false,
			transportationProvided: false,
			uniform: false,
			useParticipationFee: false,
			useRegistration: false,
			wingEventNumber: false
		}
	};

	constructor(props: PageProps) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.checkIfValid = this.checkIfValid.bind(this);
	}

	public render() {
		const NewEventForm = SimpleRequestForm as new () => SimpleRequestForm<
			NewEventFormValues,
			EventObject
		>;

		const StringListEditor = ListEditor as new () => ListEditor<string>;
		const POCListEditor = ListEditor as new () => ListEditor<
			InternalPointOfContact | ExternalPointOfContact
		>;

		const event = this.state.event;

		return this.props.member ? (
			<NewEventForm
				url="/api/event"
				id="newEventForm"
				onChange={this.updateNewEvent}
				onSubmit={this.handleSubmit}
				submitInfo={{
					text: 'Submit',
					disabled: !this.state.valid
				}}
				values={event}
			>
				<Title>Create an event</Title>
				<Label>Event name</Label>
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
					onChange={() => {
						this.setState(prev => ({
							changed: {
								...prev.changed,
								startDateTime: true
							}
						}));
					}}
				/>
				<Label>Event location</Label>
				<TextInput
					name="location"
					onChange={location => {
						this.setState(prev => ({
							event: {
								...prev.event,
								location
							},
							changed: {
								...prev.changed,
								location: true
							}
						}));
					}}
				/>
				<Label>End date and time</Label>
				<DateTimeInput
					name="endDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={() => {
						this.setState(prev => ({
							changed: {
								...prev.changed,
								endDateTime: true
							}
						}));
					}}
				/>
				<Label>Pickup date and time</Label>
				<DateTimeInput
					name="pickupDateTime"
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
					onChange={() => {
						this.setState(prev => ({
							changed: {
								...prev.changed,
								pickupDateTime: true
							}
						}));
					}}
				/>
				<Label>Pickup location</Label>
				<TextInput
					name="pickupLocation"
					onChange={pickupLocation => {
						this.setState(prev => ({
							event: {
								...prev.event,
								pickupLocation
							},
							changed: {
								...prev.changed,
								pickupLocation: true
							}
						}));
					}}
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
					labels={[
						'Hotel or individual room',
						'Open bay building',
						'Large tent',
						'Individual tent'
					]}
					other={true}
				/>
				<Label>Event website</Label>
				<TextInput name="eventWebsite" />
				<Label>High adventure decsription</Label>
				<TextInput name="highAdventureDescription" />
				<Title>Logistics Information</Title>
				<Label>Uniform</Label>
				<MultCheckbox
					name="uniform"
					labels={[
						'Dress Blue A',
						'Dress Blue B',
						'Battle Dress Uniform or Airman Battle Uniform (BDU/ABU)',
						'PT Gear',
						'Polo Shirts (Senior Members)',
						'Blue Utilities (Senior Members)',
						'Civilian Attire',
						'Flight Suit',
						'Not Applicable'
					]}
				/>
				<Label>Required forms</Label>
				<MultCheckbox
					name="requiredForms"
					labels={[
						'CAP Identification Card',
						'CAPF 31 Application For CAP Encampment Or Special Activity',
						'CAPF 32 Civil Air Patrol Cadet Activity Permission Slip',
						'CAPF 101 Specialty Qualification Card',
						'CAPF 160 CAP Member Health History Form',
						'CAPF 161 Emergency Information',
						'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication'
					]}
					other={true}
				/>
				<Label>Required equipment</Label>
				<StringListEditor
					name="requiredEquipment"
					addNew={() => ''}
					// @ts-ignore
					inputComponent={TextInput}
				/>
				<Label>Use registration deadline</Label>
				<Checkbox name="useRegistration" />

				<FormBlock
					style={{
						display: this.state.event.useRegistration
							? 'block'
							: 'none'
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

				<Label>Use participation fee</Label>
				<Checkbox name="useParticipationFee" />

				<FormBlock
					style={{
						display: this.state.event.useParticipationFee
							? 'block'
							: 'none'
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
					labels={[
						'No meals provided',
						'Meals provided',
						'Bring own food',
						'Bring money'
					]}
					other={true}
				/>

				<Title>Point of Contact</Title>

				<POCListEditor
					name="pointsOfContact"
					// @ts-ignore
					inputComponent={POCInput}
					member={this.props.member}
					addNew={() => ({
						type: PointOfContactType.INTERNAL,
						email: '',
						name: '',
						id: {
							kind: 'null'
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

				<Label>Event status</Label>
				<SimpleRadioButton
					name="status"
					labels={[
						'Draft',
						'Tentative',
						'Confirmed',
						'Complete',
						'Cancelled',
						'Information Only'
					]}
				/>

				<Label>Entry complete</Label>
				<Checkbox name="complete" />

				<Label>Publish to wing</Label>
				<Checkbox name="publishToWingCalendar" />

				<Label>Show upcoming</Label>
				<Checkbox name="showUpcoming" />

				<Label>Administration comments</Label>
				<TextInput name="administrationComments" />

				<TextBox name="null">Select a team</TextBox>

				<Label>Team</Label>
				<NumberInput name="teamID" />

				<Label>Event files</Label>
				<FileInput
					name="fileIDs"
					account={this.props.account}
					member={this.props.member}
				/>

				<Title>Debrief information</Title>

				<Label>Debrief</Label>
				<TextInput name="debrief" />
			</NewEventForm>
		) : (
			<div>Please sign in</div>
		);
	}

	private handleSubmit(event: NewEventFormValues): NewEventObject {
		const newEvent = Object.assign({}, event);

		if (!event.useParticipationFee) {
			delete newEvent.participationFee;
		}
		delete newEvent.useParticipationFee;

		if (!event.useRegistration) {
			delete newEvent.registration;
		}
		delete newEvent.useRegistration;

		return newEvent;
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.checkIfValid(event);

		const dateTimesHaveBeenModified =
			this.state.changed.startDateTime ||
			this.state.changed.endDateTime ||
			this.state.changed.pickupDateTime;

		if (!dateTimesHaveBeenModified) {
			event.startDateTime = event.meetDateTime + 300; // Five minutes
			event.endDateTime = event.meetDateTime + 300 + 3600; // 65 minutes
			event.pickupDateTime = event.meetDateTime + 300 + 3600 + 300; // 70 minutes
		}

		const locationsHaveBeenModified =
			this.state.changed.location || this.state.changed.pickupLocation;

		if (!locationsHaveBeenModified) {
			event.location = event.meetLocation;
			event.pickupLocation = event.meetLocation;
		}

		this.setState({
			event
		});
	}

	private checkIfValid(event: NewEventFormValues) {
		const fail = (() => this.setState({ valid: false })).bind(this);

		if (
			!(
				event.meetDateTime <= event.startDateTime &&
				event.startDateTime <= event.endDateTime &&
				event.endDateTime <= event.pickupDateTime
			)
		) {
			return fail();
		}

		if (event.name.length === 0) {
			return fail();
		}

		if (
			event.name === '' ||
			event.meetLocation === '' ||
			event.location === '' ||
			event.pickupLocation === ''
		) {
			return fail();
		}

		if (
			event.transportationProvided === true &&
			event.transportationDescription === ''
		) {
			return fail();
		}

		this.setState({
			valid: true
		});
	}
}
