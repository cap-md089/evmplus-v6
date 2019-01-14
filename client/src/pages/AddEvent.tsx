import { DateTime } from 'luxon';
import * as React from 'react';
import Button from 'src/components/Button';
import DownloadDialogue from 'src/components/DownloadDialogue';
import Event from 'src/lib/Event';
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
import SimpleForm, { FileInput, TextBox } from '../components/SimpleForm';
import Page, { PageProps } from './Page';

const PointOfContactType = { INTERNAL: 0, EXTERNAL: 1 };

interface AddEventState {
	event: NewEventFormValues;
	valid: boolean;
	errors: {};
	changed: { [P in keyof NewEventFormValues]: boolean };
	createError: null | number;
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

export default class AddEvent extends Page<PageProps, AddEventState> {
	public state: AddEventState = {
		createError: null,
		event: {
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
			useRegistration: false,
			registration: {
				deadline: +DateTime.utc(),
				information: ''
			},
			useParticipationFee: false,
			participationFee: {
				feeAmount: 0,
				feeDue: +DateTime.utc()
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
			wingEventNumber: [0, ''],
			regionEventNumber: [0, ''],
			complete: false,
			administrationComments: '',
			status: 0,
			debrief: '',
			pointsOfContact: [],
			signUpPartTime: false,
			teamID: null,
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
			transportationDescription: false,
			transportationProvided: false,
			uniform: false,
			useParticipationFee: false,
			useRegistration: false,
			wingEventNumber: false
		},
		teamDialogue: {
			filterValues: [],
			open: false,
			selectedValue: null,
		},
		teamPromise: this.props.account
			.getTeams()
			.then(teams => (this.teams = teams))
	};

	private teams: Team[] | null = null;

	constructor(props: PageProps) {
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

	public componentDidMount() {
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
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/calendar',
				text: 'Calendar'
			},
			{
				target: '/eventform',
				text: 'Create event'
			}
		]);
		this.updateTitle('Create event');
	}

	public render() {
		const NewEventForm = SimpleForm as new () => SimpleForm<
			NewEventFormValues
		>;

		const StringListEditor = ListEditor as new () => ListEditor<string>;
		const POCListEditor = ListEditor as new () => ListEditor<
			InternalPointOfContact | ExternalPointOfContact
		>;

		const event = this.state.event;

		const targetTeam = this.teams
			? this.teams.filter(
					team =>
						team.id.toString() ===
						(event.teamID === null ? '' : event.teamID).toString()
			  )[0]
			: undefined;

		return this.props.member ? (
			<NewEventForm
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

				<Label>Sign up deny message</Label>
				<TextInput name="signUpDenyMessage" />

				<Label>Allow signing up part time</Label>
				<Checkbox name="signUpPartTime" />

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
					account={this.props.account}
					member={this.props.member}
					addNew={() => ({
						type: PointOfContactType.INTERNAL,
						email: '',
						name: '',
						memberReference: {
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
			</NewEventForm>
		) : (
			<div>Please sign in</div>
		);
	}

	private async handleSubmit(event: NewEventFormValues) {
		const eventData: NewEventObject = {
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
			participationFee: event.useParticipationFee
				? event.participationFee
				: null,
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
			startDateTime: event.startDateTime,
			status: event.status,
			teamID: event.teamID,
			transportationDescription: event.transportationDescription,
			transportationProvided: event.transportationProvided,
			uniform: event.uniform,
			wingEventNumber: event.wingEventNumber
		};

		if (!this.props.member) {
			return;
		}

		let eventObject;

		try {
			eventObject = await Event.Create(
				eventData,
				this.props.member,
				this.props.account
			);
		} catch (e) {
			this.setState({
				createError: e.status
			});

			return;
		}

		this.props.routeProps.history.push(`/eventviewer/${eventObject.id}`);
	}

	private updateNewEvent(event: NewEventFormValues) {
		const valid = this.checkIfValid(event);

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
			this.state.changed.location || this.state.changed.pickupLocation;

		if (!locationsHaveBeenModified) {
			event.location = event.meetLocation;
			event.pickupLocation = event.meetLocation;
		}

		this.setState({
			event,
			valid
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
		const prevValues = this.state.event;


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

		this.setState({
			event: prevValues
		});
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
