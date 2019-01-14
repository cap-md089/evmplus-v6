import * as React from 'react';
import Button from 'src/components/Button';
import DownloadDialogue from 'src/components/DownloadDialogue';
import Team from 'src/lib/Team';
import {
	Checkbox,
	DateTimeInput,
	DisabledText,
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
	teamDialogue: {
		open: boolean;
		filterValues: any[];
		selectedValue: Team | null;
	};
	teamPromise: Promise<Team[]>;
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

export const convertToFormValues = (event: Event): NewEventFormValues => ({
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
	wingEventNumber: event.wingEventNumber
});

export const convertFormValuesToEvent = (event: NewEventFormValues) => ({
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
		errors: {},
		teamDialogue: {
			filterValues: [],
			open: false,
			selectedValue: null
		},
		teamPromise: this.props.account
			.getTeams()
			.then(teams => (this.teams = teams))
	};

	private teams: Team[] | null = null;

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.checkIfValid = this.checkIfValid.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

		this.onTeamDialogueFilterValueChange = this.onTeamDialogueFilterValueChange.bind(
			this
		);
		this.selectTeam = this.selectTeam.bind(this);
		this.setSelectedTeam = this.setSelectedTeam.bind(this);
		this.openTeamDialogue = this.openTeamDialogue.bind(this);
	}

	public async componentDidMount() {
		if (this.props.member) {
			const [event] = await Promise.all([
				Event.Get(
					parseInt(this.props.routeProps.match.params.id, 10),
					this.props.member,
					this.props.account
				)
			]);

			if (!event.isPOC(this.props.member)) {
				// TODO: Show error message
				return;
			}

			this.setState({
				event
			});

			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: `/eventviewer/${event.id}`,
					text: `View event "${event.name}"`
				},
				{
					target: `/eventform/${event.id}`,
					text: `Modify event "${event.name}"`
				}
			]);

			this.props.updateSideNav([
				{
					target: 'modify-event',
					text: 'Basic information',
					type: 'Reference'
				},
				{
					target: 'activity-information',
					text: 'Activity Information',
					type: 'Reference'
				},
				{
					target: 'logistics-information',
					text: 'Logistics Information',
					type: 'Reference'
				},
				{
					target: 'point-of-contact',
					text: 'Point of Contact',
					type: 'Reference'
				},
				{
					target: 'extra-information',
					text: 'Extra Information',
					type: 'Reference'
				},
				{
					target: 'team-information',
					text: 'Team Information',
					type: 'Reference'
				}
			]);

			this.updateTitle(`Modify event "${event.name}"`);
		}
	}

	public render() {
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

		const targetTeam = this.teams
			? this.teams.filter(
					team =>
						team.id.toString() ===
						(event.teamID === null ? '' : event.teamID).toString()
			  )[0]
			: undefined;

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

				<Label>Event files</Label>
				<FileInput
					name="fileIDs"
					account={this.props.account}
					member={this.props.member}
				/>

				<Title>Team information</Title>

				<Label />

				<TextBox name="null">
					<Button onClick={this.openTeamDialogue} buttonType="none">
						Select a team
					</Button>
					<DownloadDialogue<Team>
						open={this.state.teamDialogue.open}
						multiple={false}
						overflow={400}
						title="Select a team"
						showIDField={false}
						displayValue={this.displayTeam}
						valuePromise={this.state.teamPromise}
						filters={[
							{
								check: (team, input) => {
									if (
										input === '' ||
										typeof input !== 'string'
									) {
										return true;
									}

									try {
										return !!team.name.match(
											new RegExp(input, 'gi')
										);
									} catch (e) {
										return false;
									}
								},
								displayText: 'Team name',
								filterInput: TextInput
							}
						]}
						onValueClick={this.setSelectedTeam}
						onValueSelect={this.selectTeam}
						selectedValue={this.state.teamDialogue.selectedValue}
					/>
				</TextBox>

				<Label>Team ID</Label>
				<NumberInput disabled={true} name="teamID" />

				<Label>Team Name</Label>
				<DisabledText
					name="teamName"
					value={targetTeam ? targetTeam.name : ''}
				/>

				<Label>Limit sign ups to team members</Label>
				<Checkbox name="limitTeamSignups" />

				<Title>Debrief information</Title>

				<Label>Debrief</Label>
				<TextInput name="debrief" />
			</ModifyEventForm>
		);
	}

	private updateNewEvent(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

		this.state.event!.set(convertFormValuesToEvent(event));

		this.setState({
			event: this.state.event,
			valid
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

	private displayTeam(team: Team) {
		return team.name;
	}

	private onTeamDialogueFilterValueChange(filterValues: any[]) {
		this.setState(prev => ({
			teamDialogue: {
				filterValues,
				open: prev.teamDialogue.open,
				selectedValue: prev.teamDialogue.selectedValue,
			}
		}));
	}

	private setSelectedTeam(selectedValue: Team) {
		this.setState(prev => ({
			teamDialogue: {
				selectedValue,
				open: prev.teamDialogue.open,
				filterValues: prev.teamDialogue.filterValues,
			}
		}));
	}

	private selectTeam(team: Team) {
		const prevValues = convertToFormValues(this.state.event!);

		if (team === null) {
			prevValues.teamID = null;
		} else {
			prevValues.teamID = team.id;
		}

		this.setState(prev => ({
			teamDialogue: {
				selectedValue: null,
				open: false,
				filterValues: prev.teamDialogue.filterValues,
			}
		}));

		this.updateNewEvent(prevValues);
	}

	private openTeamDialogue() {
		this.setState(prev => ({
			teamDialogue: {
				open: true,
				filterValues: prev.teamDialogue.filterValues,
				selectedValue: prev.teamDialogue.selectedValue,
			}
		}));
	}
}
