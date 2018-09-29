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
import myFetch from '../lib/myFetch';
import { PageProps } from './Page';

const PointOfContactType = { INTERNAL: 0, EXTERNAL: 1 };

interface ModifyEventState {
	event: NewEventFormValues;
	valid: boolean;
	errors: {};
	changed: { [K in keyof NewEventFormValues]: boolean };
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

export default class ModifyEvent extends React.Component<
	PageProps<{ id: string }>,
	ModifyEventState
> {
	public state: ModifyEventState = {
		event: {
			name: '',
			meetDateTime: Math.round(+DateTime.utc() / 1000),
			meetLocation: '',
			startDateTime: Math.round(+DateTime.utc() / 1000),
			location: '',
			endDateTime: Math.round(+DateTime.utc() / 1000),
			pickupDateTime: Math.round(+DateTime.utc() / 1000),
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
			status: 0,
			debrief: '',
			pointsOfContact: [],
			signUpPartTime: false,
			teamID: 0,
			fileIDs: []
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

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.checkIfValid = this.checkIfValid.bind(this);
	}

	public componentDidMount() {
		myFetch('/api/event/' + this.props.routeProps.match.params.id)
			.then(val => val.json())
			.then((event: EventObject) => {
				this.setState(prev => ({
					event: {
						...prev.event,
						...event
					}
				}));
			});
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

		return this.props.member.valid ? (
			<NewEventForm
				url={'/api/event/' + this.props.routeProps.match.params.id}
				id="newEventForm"
				onChange={this.updateNewEvent}
				onSubmit={this.handleSubmit}
				values={event}
			>
				<Title>Modify event</Title>
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
					onChange={() => {
						this.setState(prev => ({
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
					onChange={() => {
						this.setState(prev => ({
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
					addNew={() => ({
						type: PointOfContactType.INTERNAL,
						email: '',
						id: 0,
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
				<FileInput name="fileIDs" />

				<Title>Debrief information</Title>

				<Label>Debrief</Label>
				<TextInput name="debrief" />
			</NewEventForm>
		) : (
			<div>Please sign in</div>
		);
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.checkIfValid(event);

		this.setState({
			event
		});
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

	private checkIfValid(event: NewEventFormValues) {
		if (
			!(
				event.meetDateTime <= event.startDateTime &&
				event.startDateTime <= event.endDateTime &&
				event.endDateTime <= event.pickupDateTime
			)
		) {
			this.setState({
				valid: false
			});
			return;
		}

		if (event.name.length === 0) {
			this.setState({
				valid: false
			});
			return;
		}

		this.setState({
			valid: true
		});
	}
}
