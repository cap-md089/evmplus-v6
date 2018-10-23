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
import Loader from '../components/Loader';
import { FileInput, TextBox } from '../components/SimpleForm';
import SimpleRequestForm from '../components/SimpleRequestForm';
import { PointOfContactType } from '../enums';
import myFetch from '../lib/myFetch';
import { PageProps } from './Page';

interface ModifyEventState {
	event: null | NewEventFormValues;
	valid: boolean;
	errors: {};
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

export default class ModifyEvent extends React.Component<
	PageProps<{ id: string }>,
	ModifyEventState
> {
	public state: ModifyEventState = {
		event: null,
		valid: false,
		errors: {}
	};

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.checkIfValid = this.checkIfValid.bind(this);
	}

	public componentDidMount() {
		if (this.props.member.valid) {
			myFetch('/api/event/' + this.props.routeProps.match.params.id)
				.then(val => val.json())
				.then((eventObject: EventObject) => {
					// For some reason, it is seeing the function as
					// the state and that it is missing values
					// @ts-ignore
					this.setState(prev => ({
						event: {
							...prev.event,
							...eventObject,
							useParticipationFee: !!eventObject.participationFee,
							useRegistration: !!eventObject.registration
						}
					}));
				});
		}
	}

	public render() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/blog',
				text: 'News'
			}
		]);

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
			event === null ? (
				<Loader />
			) : (
				<NewEventForm
					url={'/api/event/' + this.props.routeProps.match.params.id}
					id="newEventForm"
					onChange={this.updateNewEvent}
					onSubmit={this.handleSubmit}
					values={event}
					method="PUT"
					showSubmitButton={true}
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
					/>
					<Label>Event location</Label>
					<TextInput name="location" />
					<Label>End date and time</Label>
					<DateTimeInput
						name="endDateTime"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Pickup date and time</Label>
					<DateTimeInput
						name="pickupDateTime"
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
					<Label>Pickup location</Label>
					<TextInput name="pickupLocation" />
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
						labels={Activities}
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
						labels={Uniforms}
					/>
					<Label>Required forms</Label>
					<MultCheckbox
						name="requiredForms"
						labels={RequiredForms}
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
							display: event.useRegistration ? 'block' : 'none'
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
							display: event.useParticipationFee
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
							name: '',
							id: {
								kind: 'Null'
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
					<FileInput name="fileIDs" />

					<Title>Debrief information</Title>

					<Label>Debrief</Label>
					<TextInput name="debrief" />
				</NewEventForm>
			)
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
