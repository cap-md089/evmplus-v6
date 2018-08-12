import { DateTime } from 'luxon';
import * as React from 'react';
import {
	Checkbox,
	DateTimeInput,
	FormBlock,
	Label,
	ListEditor,
	MultCheckbox,
	TextInput,
	Title
} from '../components/Form';
import { InputProps } from '../components/form-inputs/Input';
import SimpleRequestForm from '../components/SimpleRequestForm';
import { PageProps } from './Page';

class POCInput extends React.Component<
	InputProps<InternalPointOfContact | ExternalPointOfContact>
> {
	public render () {
		return <div />;
	}
}

interface CreateEventState {
	event: NewEventFormValues;
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

export default class AddEvent extends React.Component<
	PageProps,
	CreateEventState
> {
	public state: CreateEventState = {
		event: {
			timeCreated: Math.round(+DateTime.utc() / 1000),
			timeModified: Math.round(+DateTime.utc() / 1000),
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
				undefined
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
			groupEventNumber: 0,
			wingEventNumber: 0,
			complete: false,
			administrationComments: '',
			status: 0,
			debrief: '',
			pointsOfContact: [],
			author: 0,
			signUpPartTime: false,
			teamID: 0
		},
		valid: false,
		errors: {}
	};

	constructor(props: PageProps) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
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

		return (
			<NewEventForm
				url="/api/event"
				id="newEventForm"
				onChange={this.updateNewEvent}
				onSubmit={console.log}
			>
				<Title>Create an event</Title>
				<Label>Event name</Label>
				<TextInput name="name" value={event.name} />
				<Label>Meet date and time</Label>
				<DateTimeInput
					name="meetDateTime"
					value={event.meetDateTime}
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>
				<Label>Meet location</Label>
				<TextInput name="meetLocation" value={event.meetLocation} />
				<Label>Start date and time</Label>
				<DateTimeInput
					name="startDateTime"
					value={event.startDateTime}
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>
				<Label>Event location</Label>
				<TextInput name="name" value={event.name} />
				<Label>End date and time</Label>
				<DateTimeInput
					name="endDateTime"
					value={event.endDateTime}
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>
				<Label>Pickup date and time</Label>
				<DateTimeInput
					name="pickupDateTime"
					value={event.pickupDateTime}
					date={true}
					time={true}
					originalTimeZoneOffset={'America/New_York'}
				/>
				<Label>Pickup location</Label>
				<TextInput name="pickupLocation" value={event.pickupLocation} />
				<Label>Transportation provided</Label>
				<Checkbox
					name="transportationProvided"
					value={event.transportationProvided}
				/>
				<Label>Transportation description</Label>
				<TextInput
					name="transportationDescription"
					value={event.transportationDescription}
				/>
				<Title>Activity Information</Title>
				<Label>Comments</Label>
				<TextInput
					boxStyles={{
						height: '50px'
					}}
					name="comments"
					value={event.comments}
				/>
				<Label>Activity type</Label>
				<MultCheckbox
					name="activity"
					value={event.activity}
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
					value={event.lodgingArrangments}
					labels={[
						'Hotel or individual room',
						'Open bay building',
						'Large tent',
						'Individual tent'
					]}
					other={true}
				/>
				<Label>Event website</Label>
				<TextInput name="eventWebsite" value={event.eventWebsite} />
				<Label>High adventure decsription</Label>
				<TextInput
					name="highAdventureDescription"
					value={event.highAdventureDescription}
				/>
				<Title>Logistics Information</Title>
				<Label>Uniform</Label>
				<MultCheckbox
					name="uniform"
					value={event.uniform}
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
					value={event.requiredForms}
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
					value={event.requiredEquipment}
					addNew={() => ''}
					// @ts-ignore
					inputComponent={TextInput}
				/>
				<Label>Use registration deadline</Label>
				<Checkbox
					name="useRegistration"
					value={this.state.event.useRegistration}
				/>

				<FormBlock
					style={{
						display: this.state.event.useRegistration
							? 'block'
							: 'none'
					}}
					name="registration"
				>
					<Label>Registration information</Label>
					<TextInput
						name="information"
						value={this.state.event.registration.information}
					/>

					<Label>Registration deadline</Label>
					<DateTimeInput
						name="deadline"
						value={this.state.event.registration.deadline}
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				</FormBlock>

				<Label>Use participation fee</Label>
				<Checkbox
					name="useParticipationFee"
					value={this.state.event.useParticipationFee}
				/>

				<FormBlock
					style={{
						display: this.state.event.useParticipationFee
							? 'block'
							: 'none'
					}}
					name="participationFee"
				>
					<Label>Participation fee</Label>
					<TextInput
						name="feeAmount"
						value={(
							this.state.event.participationFee.feeAmount || ''
						).toString()}
						onChange={value => !!value.match(/^\$?\d*\.?\d*$/)}
					/>

					<Label>Participation fee due</Label>
					<DateTimeInput
						name="feeDue"
						value={
							this.state.event.participationFee.feeDue ||
							DateTime.utc()
						}
						date={true}
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>
				</FormBlock>

				<Label>Meals</Label>
				<MultCheckbox
					name="mealsDescription"
					value={this.state.event.mealsDescription}
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
					value={this.state.event.pointsOfContact}
					// @ts-ignore
					inputComponent={POCInput}
					addNew={() => ({
						type: 'internal',
						email: '',
						id: 0,
						phone: '',
						receiveEventUpdates: false,
						receiveRoster: false,
						receiveSignUpUpdates: false,
						receiveUpdates: false
					})}
					buttonText="Add point of contact"
				/>
			</NewEventForm>
		);
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.setState({
			event
		});
	}
}
