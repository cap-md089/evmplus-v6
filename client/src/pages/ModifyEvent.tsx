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
import SimpleForm, { FileInput, TextBox } from '../components/SimpleForm';
import { PointOfContactType } from '../enums';
import Event from '../lib/Event';
import Page, { PageProps } from './Page';

interface ModifyEventState {
	event: null | Event;
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

const convertToFormValues = (event: Event): NewEventFormValues => ({
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
	wingEventNumber: event.wingEventNumber
});

const convertFormValuesToEvent = (event: NewEventFormValues) => ({
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
	teamID: event.teamID,
	transportationDescription: event.transportationDescription,
	transportationProvided: event.transportationProvided,
	uniform: event.uniform,
	wingEventNumber: event.wingEventNumber
});

export default class ModifyEvent extends Page<
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
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public async componentDidMount() {
		if (this.props.member) {
			const event = await Event.Get(
				parseInt(this.props.routeProps.match.params.id, 10),
				this.props.member,
				this.props.account
			);

			if (!event.isPOC(this.props.member)) {
				// TODO: Show error message
				return;
			}

			this.setState({
				event
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

		if (!this.props.member) {
			return <h2>Please sign in</h2>;
		}

		if (!this.state.event) {
			return <Loader />;
		}

		const ModifyEventForm = SimpleForm as new () => SimpleForm<
			NewEventFormValues
		>;

		const StringListEditor = ListEditor as new () => ListEditor<string>;
		const POCListEditor = ListEditor as new () => ListEditor<
			InternalPointOfContact | ExternalPointOfContact
		>;

		const event = convertToFormValues(this.state.event);

		return (
			<ModifyEventForm
				id="newEventForm"
				onChange={this.updateNewEvent}
				onSubmit={this.handleSubmit}
				values={event}
				submitInfo={{
					text: 'Update event',
					disabled: !this.props.member || !this.state.valid
				}}
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
				<MultCheckbox name="uniform" labels={Uniforms} />
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

				<Label>Sign up deny message</Label>
				<TextInput name="signUpDenyMessage" />

				<Label>Allow signing up part time</Label>
				<Checkbox name="signUpPartTime" />

				<Label>Use participation fee</Label>
				<Checkbox name="useParticipationFee" />

				<FormBlock
					style={{
						display: event.useParticipationFee ? 'block' : 'none'
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
					member={this.props.member}
					account={this.props.account}
					// @ts-ignore
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
						'Applied For',
						'Denied',
						'Approved'
					]}
					other={true}
				/>

				<Label>Wing event number</Label>
				<RadioButton
					name="wingEventNumber"
					labels={[
						'Not Required',
						'To Be Applied For',
						'Applied For',
						'Denied',
						'Approved'
					]}
					other={true}
				/>

				<Label>Region event number</Label>
				<RadioButton
					name="regionEventNumber"
					labels={[
						'Not Required',
						'To Be Applied For',
						'Applied For',
						'Denied',
						'Approved'
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
			</ModifyEventForm>
		);
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.checkIfValid(event);

		this.state.event!.set(convertFormValuesToEvent(event));

		this.setState({
			event: this.state.event
		});
	}

	private handleSubmit(event: NewEventFormValues) {
		if (!this.props.member) {
			return;
		}

		this.state.event!.set(convertFormValuesToEvent(event));

		this.state.event!.save(this.props.member).then(() => {
			this.props.routeProps.history.push(
				`/eventviewer/${this.state.event!.id}`
			);
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

		return true;
	}
}
