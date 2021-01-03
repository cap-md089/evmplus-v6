/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountLinkTarget,
	advancedMultCheckboxReturn,
	always,
	api,
	APIEither,
	APIEndpointReturnValue,
	areMembersTheSame,
	AsyncEither,
	AttendanceRecord,
	canSignUpForEvent,
	CAPMemberContact,
	effectiveManageEventPermissionForEvent,
	Either,
	EitherObj,
	EventObject,
	EventStatus,
	EventType,
	formatEventViewerDate as formatDate,
	forms,
	FullTeamObject,
	get,
	getMemberEmail,
	getMemberEmails,
	getMemberName,
	getMemberPhone,
	getURIComponent,
	HTTPError,
	labels,
	Maybe,
	MaybeObj,
	Member,
	MemberCreateError,
	MemberReference,
	NewAttendanceRecord,
	NewEventObject,
	Permissions,
	pipe,
	PointOfContactType,
	presentMultCheckboxReturn,
	RawResolvedEventObject,
	Right,
	spreadsheets,
	stringifyMemberReference,
	ClientUser,
} from 'common-lib';
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import * as React from 'react';
import { Link } from 'react-router-dom';
import AttendanceItemView from '../../components/AttendanceView';
import Button from '../../components/Button';
import Dialogue, { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButton from '../../components/dialogues/DialogueButton';
import DialogueButtonForm from '../../components/dialogues/DialogueButtonForm';
import DropDownList from '../../components/DropDownList';
import EnumRadioButton from '../../components/form-inputs/EnumRadioButton';
import {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Label,
	TextBox,
} from '../../components/forms/SimpleForm';
import AttendanceForm from '../../components/forms/usable-forms/AttendanceForm';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';
import './EventViewer.css';
import MarkdownRenderer from 'react-markdown-renderer';

const noop = () => void 0;

interface EventViewerViewerLoadingState {
	viewerState: 'LOADING';
}

interface EventViewerViewerLoadedState {
	viewerState: 'LOADED';

	eventInformation: api.events.events.EventViewerData;
}

interface EventViewerViewerErrorState {
	viewerState: 'ERROR';

	viewerMessage: string;
}

type EventViewerViewerState =
	| EventViewerViewerErrorState
	| EventViewerViewerLoadedState
	| EventViewerViewerLoadingState;

interface EventViewerTeamLoadingState {
	teamState: 'LOADING';
}

interface EventViewerTeamErrorState {
	teamState: 'ERROR';

	teamMessage: string;
}

interface EventViewerTeamLoadedState {
	teamState: 'LOADED';

	teamInformation: MaybeObj<APIEither<FullTeamObject>>;
}

type EventViewerTeamState =
	| EventViewerTeamLoadedState
	| EventViewerTeamLoadingState
	| EventViewerTeamErrorState;

interface EventViewerUIState {
	previousUpdatedMember: MaybeObj<MemberReference>;
	newTime: number;
	copyFiles: boolean;
	newStatus: EventStatus;
	cadetRoster: Member[] | null;
	seniorRoster: Member[] | null;
	eventRegistry: boolean;
	showingCAPIDs: boolean;
	showingemails: boolean;
	openLinkEventDialogue: boolean;
	selectedAccountToLinkTo: AccountLinkTarget | null;
	accountFilterValues: any[];
	linkEventResult: null | HTTPError | { id: number; accountID: string };
}

type EventViewerState = EventViewerUIState & EventViewerTeamState & EventViewerViewerState;

type EventViewerProps = PageProps<{ id: string }>;

export const attendanceStatusLabels = [
	'Commited/Attended',
	'Rescinded commitment to attend',
	'No show',
	'Not planning on attending',
];

const getCalendarDate = (inDate: number) => {
	const dateObject = new Date(inDate);
	const nowObject = new Date();
	return dateObject.getMonth() + '/' + dateObject.getFullYear() ===
		nowObject.getMonth() + '/' + nowObject.getFullYear()
		? ''
		: dateObject.getMonth() + 1 + '/' + dateObject.getFullYear();
};

const renderName = (renderMember: ClientUser | null) => (event: RawResolvedEventObject) => (
	member: api.events.events.EventViewerAttendanceRecord,
) => {
	const defaultRenderName = `${member.record.memberID.id}: ${member.record.memberName}`;

	if (
		!!renderMember &&
		effectiveManageEventPermissionForEvent(renderMember)(event) !== Permissions.ManageEvent.NONE
	) {
		const {
			memberName,
			memberID: { id },
		} = member.record;

		const accountName = pipe(
			Maybe.map(name => `[${name}]`),
			Maybe.orSome(''),
		)(member.orgName);

		const contactEmail = pipe(
			Maybe.map<Member, CAPMemberContact>(get('contact')),
			Maybe.flatMap(getMemberEmail),
		)(member.member);

		const contactPhone = pipe(
			Maybe.map<Member, CAPMemberContact>(get('contact')),
			Maybe.flatMap(getMemberPhone),
		)(member.member);

		const contact = [contactEmail, contactPhone].filter(Maybe.isSome).map(get('value'));
		const renderedContact = contact.length === 0 ? '' : `[${contact.join(', ')}]`;

		return `${id}: ${memberName} ${accountName} ${renderedContact}`;
	} else {
		return defaultRenderName;
	}
};

const getEmails = (renderMember: ClientUser | null) => (event: RawResolvedEventObject) => (
	member: api.events.events.EventViewerAttendanceRecord,
) => {
	const noEmail = ``;
	if (!!renderMember) {
		const contactEmails = pipe(
			Maybe.map<Member, CAPMemberContact>(get('contact')),
			Maybe.map(getMemberEmails),
			Maybe.orSome([] as string[]),
		)(member.member);

		return contactEmails.join(', ');
	} else {
		return noEmail;
	}
};

const viewerDataToEventObject = (eventViewer: api.events.events.EventViewerData): EventObject => ({
	...eventViewer.event,
	attendance: eventViewer.attendees
		.filter(Either.isRight)
		.map(get('value'))
		.map(get('record')),
	pointsOfContact: eventViewer.pointsOfContact,
});

const canEitherMaybeSignUpForEvent = (event: api.events.events.EventViewerData) => (
	team: MaybeObj<EitherObj<any, FullTeamObject>>,
): ((member: MemberReference) => EitherObj<string, void>) =>
	event.event.teamID === null || event.event.teamID === undefined
		? canSignUpForEvent(viewerDataToEventObject(event))(Maybe.none())
		: Maybe.isNone(team) || Either.isLeft(team.value)
		? always(Either.left('Could not load team information'))
		: canSignUpForEvent(viewerDataToEventObject(event))(Maybe.some(team.value.value));

export default class EventViewer extends Page<EventViewerProps, EventViewerState> {
	public state: EventViewerState = {
		viewerState: 'LOADING',
		teamState: 'LOADING',
		previousUpdatedMember: Maybe.none(),
		newTime: 0,
		newStatus: EventStatus.DRAFT,
		copyFiles: true,
		cadetRoster: null,
		seniorRoster: null,
		eventRegistry: false,
		showingCAPIDs: false,
		showingemails: false,
		accountFilterValues: [],
		linkEventResult: null,
		openLinkEventDialogue: false,
		selectedAccountToLinkTo: null,
	};

	constructor(props: EventViewerProps) {
		super(props);

		this.addAttendanceRecord = this.addAttendanceRecord.bind(this);
		this.clearPreviousMember = this.clearPreviousMember.bind(this);
		this.removeAttendanceRecord = this.removeAttendanceRecord.bind(this);
		this.modifyAttendanceRecord = this.modifyAttendanceRecord.bind(this);

		this.moveEvent = this.moveEvent.bind(this);
		this.copyMoveEvent = this.copyMoveEvent.bind(this);
		this.copyEvent = this.copyEvent.bind(this);
		this.deleteEvent = this.deleteEvent.bind(this);
		this.addDebrief = this.addDebrief.bind(this);
		this.deleteDebrief = this.deleteDebrief.bind(this);

		this.renderFormsButtons = this.renderFormsButtons.bind(this);
		this.createCAPF6080 = this.createCAPF6080.bind(this);
		this.createAttendanceSpreadsheet = this.createAttendanceSpreadsheet.bind(this);
	}

	public async componentDidMount() {
		const eventInformation = await fetchApi.events.events.getViewerData(
			{ id: this.props.routeProps.match.params.id.split('-')[0] },
			{},
		);

		if (Either.isLeft(eventInformation)) {
			this.setState(prev => ({
				...prev,

				viewerState: 'ERROR',
				viewerMessage: eventInformation.value.message,
			}));

			this.props.updateBreadCrumbs([
				{
					text: 'Home',
					target: '/',
				},
				{
					target: '/calendar',
					text: 'Calendar',
				},
			]);

			this.props.updateSideNav([]);

			this.updateTitle(`View event`);

			return;
		}

		const { event } = eventInformation.value;

		this.setState(prev => ({
			...prev,

			viewerState: 'LOADED',
			eventInformation: eventInformation.value,
		}));

		this.props.updateBreadCrumbs([
			{
				text: 'Home',
				target: '/',
			},
			{
				target: '/calendar/' + getCalendarDate(eventInformation.value.event.startDateTime),
				text: 'Calendar',
			},
			{
				target: getURIComponent(eventInformation.value.event),
				text: `View ${eventInformation.value.event.name}`,
			},
		]);

		let teamInfo: MaybeObj<APIEndpointReturnValue<api.team.GetTeam>> = Maybe.none();

		if (event.teamID !== null && event.teamID !== undefined) {
			const teamInfoEither = await fetchApi.team
				.get({ id: event.teamID.toString() }, {})
				.map(Maybe.some)
				.map(Maybe.map(Either.right));

			if (Either.isRight(teamInfoEither)) {
				teamInfo = teamInfoEither.value;

				this.setState(prev => ({
					...prev,

					teamState: 'LOADED',
					teamInformation: teamInfo,
				}));
			} else {
				this.setState(prev => ({
					...prev,

					teamState: 'ERROR',
					teamMessage: 'Could not load team membership information',
				}));
			}
		} else {
			this.setState(prev => ({
				...prev,
				teamState: 'LOADED',
				teamInformation: Maybe.none(),
			}));
		}

		// Make this work sometime?
		// With this uncommented, the page rerenders an extra time
		// This causes there to be two web requests
		// If this can be done without unmounting/remounting, that would be great
		// this.updateURL(`/eventviewer/${eventInformation.value.event.getEventURLComponent()}`);
		// Probably to come with React Redux

		if (
			this.props.member &&
			Either.isRight(
				canEitherMaybeSignUpForEvent(eventInformation.value)(teamInfo)(this.props.member),
			)
		) {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference',
				},
				{
					target: 'signup',
					text: 'Sign up',
					type: 'Reference',
				},
				{
					target: 'attendance',
					text: 'Attendance',
					type: 'Reference',
				},
			]);
		} else if (this.props.member) {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference',
				},
				{
					target: 'attendance',
					text: 'Attendance',
					type: 'Reference',
				},
			]);
		} else {
			this.props.updateSideNav([
				{
					target: 'information',
					text: 'Event Information',
					type: 'Reference',
				},
			]);
		}

		this.updateTitle(`View event ${eventInformation.value.event.name}`);
	}

	public render() {
		if (this.state.viewerState === 'LOADING') {
			return <Loader />;
		}

		if (this.state.viewerState === 'ERROR') {
			return <div>{this.state.viewerMessage}</div>;
		}

		const eventViewerInfo = this.state.eventInformation;
		const { event, attendees, pointsOfContact, authorFullName } = eventViewerInfo;
		const { member, fullMemberDetails } = this.props;

		return (
			<>
				<div className="eventviewerroot">
					{member &&
					effectiveManageEventPermissionForEvent(member)(event) !==
						Permissions.ManageEvent.NONE ? (
						<>
							<Link to={`/eventform/${event.id}`}>Edit event "{event.name}"</Link>
							{' | '}
							<DialogueButtonForm<{
								newTime: number;
								copyFiles: boolean;
							}>
								buttonText="Move event"
								buttonClass="underline-button"
								buttonType="none"
								displayButtons={DialogueButtons.YES_NO_CANCEL}
								onYes={this.moveEvent}
								onNo={this.copyMoveEvent}
								title="Move event"
								labels={['Move event', 'Copy move event', 'Cancel']}
								values={{
									newTime: event.startDateTime,
									copyFiles: true,
								}}
							>
								<TextBox name="null">
									<span
										style={{
											lineHeight: '1px',
										}}
									>
										<span style={{ color: 'red' }}>WARNING:</span> moving this
										event may cause confusion.
										<br />
										Consider instead copying this event, and marking
										<br />
										this event as cancelled.
										<br />
										<br />
										Or, click the 'Copy move button' to perform this
										<br />
										action automatically
									</span>
								</TextBox>

								{/* <Label>Copy files to new event</Label>
								<Checkbox name="copyFiles" /> */}

								<Label>New start time of event</Label>
								<DateTimeInput
									name="newTime"
									time={true}
									originalTimeZoneOffset={'America/New_York'}
								/>
							</DialogueButtonForm>
							{' | '}
							{effectiveManageEventPermissionForEvent(member)(event) ===
							Permissions.ManageEvent.FULL ? (
								<>
									<DialogueButtonForm<{
										newTime: number;
										copyFiles: boolean;
										newStatus: EventStatus;
									}>
										buttonText="Copy event"
										buttonType="none"
										buttonClass="underline-button"
										displayButtons={DialogueButtons.OK_CANCEL}
										onOk={this.copyEvent}
										title="Copy event"
										labels={['Copy event', 'Cancel']}
										values={{
											newTime: event.startDateTime,
											copyFiles: true,
											newStatus: event.status,
										}}
									>
										<Label>New event status</Label>
										<EnumRadioButton
											name="newStatus"
											labels={labels.EventStatusLabels}
											values={[
												EventStatus.DRAFT,
												EventStatus.TENTATIVE,
												EventStatus.CONFIRMED,
												EventStatus.COMPLETE,
												EventStatus.CANCELLED,
												EventStatus.INFORMATIONONLY,
											]}
											defaultValue={EventStatus.INFORMATIONONLY}
										/>

										<Label>Copy files to new event</Label>
										<Checkbox name="copyFiles" />

										<Label>Start time of new event</Label>
										<DateTimeInput
											name="newTime"
											time={true}
											originalTimeZoneOffset={'America/New_York'}
										/>
									</DialogueButtonForm>
									{' | '}
								</>
							) : null}
							<DialogueButton
								buttonText="Delete event"
								buttonType="none"
								buttonClass="underline-button"
								displayButtons={DialogueButtons.OK_CANCEL}
								onOk={this.deleteEvent}
								title="Delete event"
								labels={['Yes', 'No']}
							>
								Really delete event?
							</DialogueButton>
							{' | '}
							<Link to={`/auditviewer/${event.id}`}>View Audit Log</Link>
							{/* {' | '}
								<Button buttonType="none">Print Cadet Roster</Button>
								{' | '}
								<Button buttonType="none">Print Senior Roster</Button>
								{' | '}
								<Button buttonType="none">Print Event Registry</Button> */}
						</>
					) : null}
					{member &&
					effectiveManageEventPermissionForEvent(member)(event) ===
						Permissions.ManageEvent.FULL ? (
						<>
							<br />
							<Link to={`/events/scanadd/${event.id}`}>Attendance scanner</Link>
							{' | '}
							<Link to={`/multiadd/${event.id}`}>Add attendance</Link>
						</>
					) : null}
					{(member && effectiveManageEventPermissionForEvent(member)(event)) ||
					(fullMemberDetails.error === MemberCreateError.NONE &&
						event.type === EventType.REGULAR) ? (
						<>
							<br />
							<br />
						</>
					) : null}
					<div id="information">
						<h1>{event.name}</h1>
						{event.subtitle ? <h2>{event.subtitle}</h2> : null}
						<h3>Event information</h3>
						<strong>Event ID: </strong> {event.accountID.toUpperCase()}-{event.id}
						<br />
						<strong>Meet</strong> at {formatDate(event.meetDateTime)} at{' '}
						{event.meetLocation}
						<br />
						<strong>Start</strong> at {formatDate(event.startDateTime)} at{' '}
						{event.location}
						<br />
						<strong>End</strong> at {formatDate(event.endDateTime)}
						<br />
						<strong>Pickup</strong> at {formatDate(event.pickupDateTime)} at{' '}
						{event.pickupLocation}
						<br />
						<br />
						<strong>Event status: </strong>
						{/* {eventStatus(event.status)} */}
						{event.status === EventStatus.COMPLETE ? (
							'Complete'
						) : event.status === EventStatus.CANCELLED ? (
							<span style={{ color: '#dc2127' }}>Cancelled!</span>
						) : event.status === EventStatus.TENTATIVE ? (
							<span style={{ color: '#46d6db' }}>Tentative</span>
						) : event.status === EventStatus.CONFIRMED ? (
							'Confirmed'
						) : event.status === EventStatus.DRAFT ? (
							<span style={{ color: 'darkgreen' }}>DRAFT</span>
						) : event.status === EventStatus.INFORMATIONONLY ? (
							'Information Only'
						) : (
							''
						)}
						<br />
						{member &&
						(event.status === EventStatus.COMPLETE ||
							event.status === EventStatus.CANCELLED) ? (
							<DialogueButtonForm<{
								publicView: boolean;
								debriefText: string;
							}>
								buttonText="Submit a debrief item for this event"
								buttonClass="underline-button"
								buttonType="none"
								displayButtons={DialogueButtons.OK_CANCEL}
								onOk={this.addDebrief}
								title="Submit Debrief"
								labels={['Submit', 'Cancel']}
								values={{
									publicView: false,
									debriefText: 'Replace this text with debrief description',
								}}
							>
								<Label>
									Select debrief visibility. 'Managers Only' will display this
									only to Managers/POCs. 'All Members' will display this to any
									logged in member.
								</Label>
								<EnumRadioButton
									name="publicView"
									labels={['All Members', 'Managers Only']}
									values={[true, false]}
									defaultValue={false}
								/>

								<Label>
									Describe: 1) How did the event go?, 2) What specifically went
									well, 3) What did not go well, 4) what should change for next
									time
								</Label>
								<BigTextBox name="debriefText" />
							</DialogueButtonForm>
						) : null}
						<br />
						<br />
						<strong>Transportation provided:</strong>{' '}
						{event.transportationProvided ? 'YES' : 'NO'}
						<br />
						{event.transportationProvided ? (
							<>
								<strong>Transportation Description:</strong>{' '}
								{event.transportationDescription}
								<br />
							</>
						) : null}
						<strong>Uniform:</strong>{' '}
						{pipe(
							Maybe.map(uniform => <>{uniform}</>),
							Maybe.orSome(<i>No uniform specified</i>),
						)(presentMultCheckboxReturn(event.uniform))}
						<br />
						{event.comments ? (
							<>
								<strong>Comments:</strong>{' '}
								<MarkdownRenderer markdown={event.comments} />
								<br />
							</>
						) : null}
						{member && event.memberComments ? (
							<>
								<strong>Member Viewable Comments:</strong>{' '}
								<MarkdownRenderer markdown={event.memberComments} />
								<br />
							</>
						) : null}
						<strong>Activity:</strong>{' '}
						{pipe(
							Maybe.map(activities => <>{activities}</>),
							Maybe.orSome(<i>Unknown activity type</i>),
						)(presentMultCheckboxReturn(event.activity))}
						<br />
						{member &&
						effectiveManageEventPermissionForEvent(member)(event) !==
							Permissions.ManageEvent.NONE ? (
							<>
								<strong>Organizer form links:</strong>
								<ul>
									<li>
										<a
											href="https://www.gocivilairpatrol.com/media/cms/CAPF160_7_May_2020_D185E324398F9.pdf"
											target="_blank"
											rel="noopener noreferrer"
										>
											CAPF 160 Deliberate Risk Assessment Worksheet
										</a>
									</li>
									<li>
										<a
											href="https://www.gocivilairpatrol.com/media/cms/CAPF160HL__Final_for_publication__2_D25311B050546.pdf"
											target="_blank"
											rel="noopener noreferrer"
										>
											CAPF 160HL Hazard Listing Worksheet
										</a>
									</li>
									<li>
										<a
											href="https://www.gocivilairpatrol.com/media/cms/CAPF160_S_7_May_2020_F5840F67449A8.pdf"
											target="_blank"
											rel="noopener noreferrer"
										>
											CAPF 160S Real Time Risk Assessment Worksheet
										</a>
									</li>
								</ul>
								<strong>Required participant forms:</strong>
							</>
						) : (
							<strong>Required forms:</strong>
						)}
						{pipe(
							(renderedForms: JSX.Element[]) =>
								renderedForms.length === 0
									? Maybe.none()
									: Maybe.some(renderedForms),
							Maybe.map<JSX.Element[], JSX.Element>(renderedForms => (
								<ol key={0}>
									{renderedForms.map((form, index) => (
										<li key={index}>{form}</li>
									))}
								</ol>
							)),
							Maybe.orSome<JSX.Element>(
								<>
									<i key={0}>No forms required</i>
									<br />
								</>,
							),
						)(advancedMultCheckboxReturn(event.requiredForms, this.renderFormsButtons))}
						{event.requiredEquipment.length > 0 ? (
							<>
								<strong>Required equipment:</strong>{' '}
								{event.requiredEquipment.join(', ')}
								<br />
							</>
						) : null}
						<strong>Desired number of participants:</strong>{' '}
						{event.desiredNumberOfParticipants}
						<br />
						{event.eventWebsite !== '' ? (
							<>
								<strong>Website:</strong>{' '}
								<a
									href={event.eventWebsite}
									target="_blank"
									rel="noopener noreferrer"
								>
									{event.eventWebsite}
								</a>
							</>
						) : null}
						<br />
						{member && Maybe.isSome(authorFullName) ? (
							<>
								<strong>Event Author:</strong> {authorFullName.value}
								<br />
							</>
						) : null}
						{!member ||
						event.debrief.length === 0 ? null : effectiveManageEventPermissionForEvent(
								member,
						  )(event) !== Permissions.ManageEvent.NONE ? (
							<>
								<div className="debrieflist">
									<h3>All Debrief Items</h3>
									{/* <DropDownList
										titles={"Debrief Items", 1, new String[]}
										values={[]}
										onlyOneOpen={true}
										keyFunc={rec =>
											stringifyMemberReference(rec.record.memberID)
										}
									>

									</DropDownList>  */}

									<table>
										<tr>
											<th>Time Submitted</th>
											<th>Member Name</th>
											<th>View</th>
											<th>Text</th>
											<th>Link</th>
										</tr>
										{event.debrief.flatMap((debriefElement, index) => [
											<tr>
												<td>{formatDate(debriefElement.timeSubmitted)}</td>
												<td>{debriefElement.memberName}</td>
												<td>{debriefElement.publicView ? 'All' : 'Mgr'}</td>
												<td>{debriefElement.debriefText}</td>
												<td>
													<DialogueButtonForm<{
														timeSubmitted: number;
													}>
														buttonText="Delete"
														buttonType="none"
														buttonClass="underline-button"
														displayButtons={DialogueButtons.OK_CANCEL}
														onOk={this.deleteDebrief}
														title="Really delete debrief item?"
														values={{
															timeSubmitted:
																debriefElement.timeSubmitted,
														}}
														labels={['Yes', 'No']}
													>
														<Label />
														Really delete debrief item?
													</DialogueButtonForm>
												</td>
											</tr>,
										])}
									</table>
								</div>
							</>
						) : event.debrief.filter(val => val.publicView === true).length +
								event.debrief.filter(val => val.memberRef.id === member.id).length >
						  0 ? (
							<>
								<div className="debrieflist">
									<h3>Debrief Items</h3>
									<table>
										<tr>
											<th>Time Submitted</th>
											{event.debrief.filter(
												val =>
													val.publicView === true &&
													val.memberRef.id !== member.id,
											).length > 0 ? (
												<th>MemberName</th>
											) : null}
											{event.debrief.filter(
												val => val.memberRef.id === member.id,
											).length > 0 ? (
												<th>View</th>
											) : null}
											<th>Text</th>
										</tr>
										{event.debrief
											.filter(
												val =>
													val.memberRef.id === member.id ||
													val.publicView === true,
											)
											.flatMap((debriefElement, index) => [
												<tr>
													<td>
														{formatDate(debriefElement.timeSubmitted)}
													</td>
													{event.debrief.filter(
														val =>
															val.publicView === true &&
															val.memberRef.id !== member.id,
													).length > 0 ? (
														<td>{debriefElement.memberName}</td>
													) : null}
													{event.debrief.filter(
														val => val.memberRef.id === member.id,
													).length > 0 ? (
														<td>
															{debriefElement.publicView
																? 'All'
																: 'Mgr'}
														</td>
													) : null}
													<td>{debriefElement.debriefText}</td>
												</tr>,
											])}
									</table>
								</div>
							</>
						) : null}
						{pointsOfContact.length > 0 ? <h3>Contact information</h3> : null}
						<div>
							{pointsOfContact.map((poc, i) =>
								poc.type === PointOfContactType.INTERNAL ? (
									<div key={i}>
										<b>CAP Point of Contact: </b>
										{poc.name}
										<br />
										{!!poc.email ? (
											<>
												<b>CAP Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{!!poc.phone ? (
											<>
												<b>CAP Point of Contact Phone: </b>
												{poc.phone}
												<br />
											</>
										) : null}
										<br />
									</div>
								) : (
									<div key={i}>
										<b>External Point of Contact: </b>
										{poc.name}
										<br />
										{poc.email !== '' ? (
											<>
												<b>External Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{poc.phone !== '' ? (
											<>
												<b>External Point of Contact Phone: </b>
												{poc.phone}
												<br />
											</>
										) : null}
										<br />
									</div>
								),
							)}
						</div>
					</div>
					{member !== null ? (
						this.state.teamState === 'LOADING' ? (
							<Loader />
						) : this.state.teamState === 'ERROR' ? (
							<div>{this.state.teamMessage}</div>
						) : (
							<>
								<div id="signup">
									{Either.cata<string, void, React.ReactElement | null>(err =>
										err !== 'Member is already in attendance' ? (
											<p>Cannot sign up for event: {err}</p>
										) : null,
									)(() =>
										Date.now() < event.pickupDateTime ? (
											<>
												<h3>Sign up</h3>
												<AttendanceForm
													account={this.props.account}
													event={viewerDataToEventObject(eventViewerInfo)}
													member={member}
													updateRecord={this.addAttendanceRecord}
													updated={false}
													clearUpdated={this.clearPreviousMember}
													removeRecord={noop}
													signup={true}
													registry={this.props.registry}
												/>
											</>
										) : null,
									)(
										canEitherMaybeSignUpForEvent(eventViewerInfo)(
											this.state.teamInformation,
										)(member),
									)}
									<h3 id="attendance">Attendance</h3>

									{this.state.eventInformation.attendees.some(
										rec =>
											Either.isRight(rec) &&
											rec.value.record.memberID.type === 'CAPNHQMember',
									) ? (
										<>
											<Button
												buttonType="none"
												onClick={() =>
													this.setState({ showingemails: true })
												}
											>
												Show emails
											</Button>
											{' | '}
											<Button
												buttonType="none"
												onClick={() =>
													this.setState({ showingCAPIDs: true })
												}
											>
												Show CAP IDs
											</Button>
										</>
									) : null}
									{attendees.filter(Either.isRight).length > 0 &&
									effectiveManageEventPermissionForEvent(member)(event) ? (
										<>
											{' | '}
											<Button
												buttonType="none"
												onClick={this.createAttendanceSpreadsheet}
											>
												Download Attendance Spreadsheet
											</Button>
											<br />
											<br />
										</>
									) : null}
									<Dialogue
										displayButtons={DialogueButtons.OK}
										open={this.state.showingCAPIDs}
										title="CAP IDs"
										onClose={() => this.setState({ showingCAPIDs: false })}
									>
										{this.state.eventInformation.attendees
											.filter(
												(
													val,
												): val is Right<
													api.events.events.EventViewerAttendanceRecord
												> =>
													Either.isRight(val) &&
													val.value.record.memberID.type ===
														'CAPNHQMember',
											)
											.map(rec => rec.value.record.memberID.id)
											.join(', ')}
									</Dialogue>
									<Dialogue
										displayButtons={DialogueButtons.OK}
										open={this.state.showingemails}
										title="Emails"
										onClose={() => this.setState({ showingemails: false })}
									>
										{this.state.eventInformation.attendees
											.filter(Either.isRight)
											.map(rec => getEmails(member)(event)(rec.value))
											.join(', ')}
									</Dialogue>
									<DropDownList<api.events.events.EventViewerAttendanceRecord>
										titles={renderName(member)(event)}
										values={attendees.filter(Either.isRight).map(get('value'))}
										onlyOneOpen={true}
										keyFunc={rec =>
											stringifyMemberReference(rec.record.memberID)
										}
									>
										{(val, i) => (
											<AttendanceItemView
												attendanceRecord={val.record}
												clearUpdated={this.clearPreviousMember}
												owningAccount={this.props.account}
												owningEvent={event}
												registry={this.props.registry}
												member={member}
												recordMember={Maybe.orSome<Member | null>(null)(
													val.member,
												)}
												removeAttendance={this.removeAttendanceRecord}
												updateAttendance={this.modifyAttendanceRecord}
												updated={pipe(
													Maybe.map(
														areMembersTheSame(val.record.memberID),
													),
													Maybe.orSome(false),
												)(this.state.previousUpdatedMember)}
												key={stringifyMemberReference(val.record.memberID)}
												pickupDateTime={event.pickupDateTime}
												index={i}
											/>
										)}
									</DropDownList>
									{attendees.length === 0 ? (
										<div>
											No{' '}
											{event.privateAttendance &&
											effectiveManageEventPermissionForEvent(member)(
												event,
											) !== Permissions.ManageEvent.NONE
												? 'public '
												: ''}
											attendance records
										</div>
									) : null}
								</div>
							</>
						)
					) : (
						<SigninLink>Sign in to see more information</SigninLink>
					)}
				</div>
			</>
		);
	}

	private modifyAttendanceRecord(record: Required<NewAttendanceRecord>, member: Member | null) {
		if (this.state.viewerState !== 'LOADED') {
			return;
		}

		this.setState(prev =>
			prev.viewerState === 'LOADED'
				? {
						...prev,

						previousUpdatedMember: Maybe.some(record.memberID),
						eventInformation: {
							...prev.eventInformation,
							attendees: prev.eventInformation.attendees.map(rec =>
								Either.isLeft(rec) ||
								member === null ||
								!areMembersTheSame(member)(rec.value.record.memberID)
									? rec
									: Either.right<
											HTTPError,
											api.events.events.EventViewerAttendanceRecord
									  >({
											member: Maybe.fromValue(member),
											orgName: Maybe.some(this.props.registry.Website.Name),
											record: {
												...record,
												timestamp: rec.value.record.timestamp,
												summaryEmailSent: false,
												sourceAccountID: this.props.account.id,
												sourceEventID: prev.eventInformation.event.id,
												shiftTime: record.shiftTime ?? {
													arrivalTime:
														prev.eventInformation.event.pickupDateTime,
													departureTime:
														prev.eventInformation.event.meetDateTime,
												},
												memberName: Maybe.orSome(
													stringifyMemberReference(record.memberID),
												)(
													Maybe.map(getMemberName)(
														Maybe.fromValue(member),
													),
												),
											},
									  }),
							),
						},
				  }
				: prev,
		);
	}

	private addAttendanceRecord(record: Required<NewAttendanceRecord>) {
		if (this.state.viewerState !== 'LOADED') {
			return;
		}

		this.setState(prev =>
			prev.viewerState === 'LOADED'
				? {
						...prev,

						previousUpdatedMember: Maybe.some(record.memberID),
						eventInformation: {
							...prev.eventInformation,
							attendees: [
								...prev.eventInformation.attendees,
								Either.right<
									HTTPError,
									api.events.events.EventViewerAttendanceRecord
								>({
									record: {
										...record,
										timestamp: Date.now(),
										summaryEmailSent: false,
										sourceAccountID: this.props.account.id,
										sourceEventID: prev.eventInformation.event.id,
										shiftTime: record.shiftTime ?? {
											arrivalTime: prev.eventInformation.event.pickupDateTime,
											departureTime: prev.eventInformation.event.meetDateTime,
										},
										memberName: getMemberName(this.props.member!),
									},
									member: Maybe.fromValue(this.props.member),
									orgName: Maybe.some(this.props.registry.Website.Name),
								}),
							],
						},
				  }
				: prev,
		);
	}

	private removeAttendanceRecord(record: AttendanceRecord) {
		this.setState(prev =>
			prev.viewerState !== 'LOADED'
				? prev
				: {
						...prev,
						eventInformation: {
							...prev.eventInformation,
							attendees: prev.eventInformation.attendees.filter(
								mem =>
									Either.isLeft(mem) ||
									!areMembersTheSame(mem.value.record.memberID)(record.memberID),
							),
						},
				  },
		);
	}

	private clearPreviousMember() {
		this.setState({
			previousUpdatedMember: Maybe.none(),
		});
	}

	private async moveEvent({ newTime }: { newTime: number }) {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const { event } = state.eventInformation;

		const timeDelta = newTime - event.startDateTime;

		const newEvent: Partial<NewEventObject> = {
			meetDateTime: event.meetDateTime + timeDelta,
			startDateTime: newTime,
			endDateTime: event.endDateTime + timeDelta,
			pickupDateTime: event.pickupDateTime + timeDelta,
		};

		await fetchApi.events.events.set({ id: event.id.toString() }, newEvent);

		this.setState({
			...state,

			eventInformation: {
				...state.eventInformation,
				event: {
					...state.eventInformation.event,
					...newEvent,
				},
			},
		});
	}

	private async addDebrief({
		debriefText,
		publicView,
	}: {
		debriefText: string;
		publicView: boolean;
	}) {
		const state = this.state;
		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to add debrief to a null event');
		}

		if (!this.props.member) {
			return;
		}

		const { event } = state.eventInformation;
		await AsyncEither.All([
			fetchApi.events.debrief.add({ id: event.id.toString() }, { debriefText, publicView }),
		]);

		//force page reload
		window.location.reload();
	}

	private async deleteDebrief({ timeSubmitted }: { timeSubmitted: number }) {
		const state = this.state;
		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to add debrief to a null event');
		}

		if (!this.props.member) {
			return;
		}

		const { event } = state.eventInformation;
		await AsyncEither.All([
			fetchApi.events.debrief.delete(
				{ id: event.id.toString(), timestamp: timeSubmitted.toString() },
				{},
			),
		]);

		//force page reload
		window.location.reload();
	}

	private async copyMoveEvent({ newTime, copyFiles }: { newTime: number; copyFiles: boolean }) {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const { event } = state.eventInformation;

		const newEvent: Partial<NewEventObject> = {
			status: EventStatus.CANCELLED,
		};

		const result = await AsyncEither.All([
			fetchApi.events.events.set({ id: event.id.toString() }, newEvent),
			fetchApi.events.events.copy(
				{ id: event.id.toString() },
				{ newTime, copyFiles, newStatus: event.status },
			),
		]);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/eventviewer/${result.value[1].id}`);
		}
	}

	private async copyEvent({
		newTime,
		copyFiles,
		newStatus,
	}: {
		newTime: number;
		copyFiles: boolean;
		newStatus: EventStatus;
	}) {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.events.events.copy(
			{ id: state.eventInformation.event.id.toString() },
			{ newTime, copyFiles, newStatus },
		);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/eventviewer/${result.value.id}`);
		}
	}

	private async deleteEvent() {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.events.events.delete(
			{ id: state.eventInformation.event.id.toString() },
			{},
		);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/calendar/`);
		}
	}

	private renderFormsButtons(formName: string): JSX.Element {
		if (!this.props.member) {
			return <>{formName}</>;
		}

		if (formName === 'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip') {
			return (
				<Button buttonType="none" onClick={this.createCAPF6080}>
					{formName}
				</Button>
			);
		} else if (formName === 'CAPF 160 CAP Member Health History Form') {
			return (
				<a
					href="https://www.gocivilairpatrol.com/media/cms/F160_158EAB9B13D02.pdf"
					target="_blank"
					rel="noopener noreferrer"
				>
					{formName}
				</a>
			);
		} else if (formName === 'CAPF 161 Emergency Information') {
			return (
				<a
					href="https://www.gocivilairpatrol.com/media/cms/F161_023ECA81C03FB.pdf"
					target="_blank"
					rel="noopener noreferrer"
				>
					{formName}
				</a>
			);
		} else if (
			formName ===
			'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication'
		) {
			return (
				<a
					href="https://www.gocivilairpatrol.com/media/cms/F163_7154E3E39FAFE.pdf"
					target="_blank"
					rel="noopener noreferrer"
				>
					{formName}
				</a>
			);
		} else {
			return <>{formName}</>;
		}
	}

	private async createCAPF6080() {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		const docDef = forms.capf6080DocumentDefinition(
			this.state.eventInformation.event,
			this.state.eventInformation.pointsOfContact,
			this.props.member,
			process.env.REACT_APP_HOST_NAME!,
		);

		await this.printForm(
			docDef,
			`CAPF6080-${this.props.account.id}-${this.state.eventInformation.event.id}.pdf`,
		);
	}

	private async printForm(docDef: TDocumentDefinitions, fileName: string) {
		const pdfMake = await import('pdfmake');

		const fontGetter =
			process.env.NODE_ENV === 'production'
				? (fontName: string) =>
						`https://${this.props.account.id}.${process.env.REACT_APP_HOST_NAME}/images/fonts/${fontName}`
				: (fontName: string) => `http://localhost:3000/images/fonts/${fontName}`;

		const fonts: TFontDictionary = {
			Roboto: {
				normal: fontGetter('Roboto-Regular.ttf'),
				bold: fontGetter('Roboto-Medium.ttf'),
				italics: fontGetter('Roboto-Italic.ttf'),
				bolditalics: fontGetter('Roboto-MediumItalic.ttf'),
			},
			FreeMono: {
				normal: fontGetter('FreeMono.ttf'),
				bold: fontGetter('FreeMonoBold.ttf'),
				italics: fontGetter('FreeMonoOblique.ttf'),
				bolditalics: fontGetter('FreeMonoBoldOblique.ttf'),
			},
			FreeSans: {
				normal: fontGetter('FreeSans.ttf'),
				bold: fontGetter('FreeSansBold.ttf'),
				italics: fontGetter('FreeSansOblique.ttf'),
				bolditalics: fontGetter('FreeSansBoldOblique.ttf'),
			},
			FreeSerif: {
				normal: fontGetter('FreeSerif.ttf'),
				bold: fontGetter('FreeSerifBold.ttf'),
				italics: fontGetter('FreeSerifItalic.ttf'),
				bolditalics: fontGetter('FreeSerifBoldItalic.ttf'),
			},
		};

		// @ts-ignore
		const docPrinter = pdfMake.createPdf(docDef, null, fonts);

		docPrinter.download(fileName);
	}

	private async createAttendanceSpreadsheet() {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		const XLSX = await import('xlsx');

		const wb = XLSX.utils.book_new();
		const evtID =
			this.state.eventInformation.event.accountID +
			'-' +
			this.state.eventInformation.event.id;

		let wsName = 'EventInfo';
		const wsDataEvent = spreadsheets.EventXL(this.state.eventInformation.event);
		let ws = XLSX.utils.aoa_to_sheet(wsDataEvent);
		let sheet = spreadsheets.FormatEventXL(evtID, ws, process.env.REACT_APP_HOST_NAME!);
		XLSX.utils.book_append_sheet(wb, sheet, wsName);

		wsName = 'Attendance';
		const [wsDataAttendance, widths] = spreadsheets.AttendanceXL(
			this.state.eventInformation.event,
			this.state.eventInformation.attendees
				.filter(Either.isRight)
				.map(record => record.value),
		);
		ws = XLSX.utils.aoa_to_sheet(wsDataAttendance);
		sheet = spreadsheets.FormatAttendanceXL(
			ws,
			widths,
			this.state.eventInformation.event.customAttendanceFields,
			XLSX.utils.encode_cell,
			wsDataAttendance.length,
		);
		XLSX.utils.book_append_sheet(wb, sheet, wsName);

		XLSX.writeFile(wb, `Attendance ${evtID}.xlsx`);
	}
}
