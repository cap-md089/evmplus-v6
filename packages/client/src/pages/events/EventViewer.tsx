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
	ClientUser,
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
	getFullMemberName,
	getMemberEmail,
	getMemberEmails,
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
	spreadsheets,
	stringifyMemberReference,
	toReference,
} from 'common-lib';
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import * as React from 'react';
import MarkdownRenderer from 'react-markdown-renderer';
import { Link } from 'react-router-dom';
import AttendanceItemView from '../../components/AttendanceView';
import Button from '../../components/Button';
import Dialogue, { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButton from '../../components/dialogues/DialogueButton';
import DialogueButtonForm from '../../components/dialogues/DialogueButtonForm';
import DownloadDialogue from '../../components/dialogues/DownloadDialogue';
import DropDownList from '../../components/DropDownList';
import EnumRadioButton from '../../components/form-inputs/EnumRadioButton';
import { CheckInput } from '../../components/form-inputs/Selector';
import {
	BigTextBox,
	Checkbox,
	DateTimeInput,
	Label,
	TextBox,
	TextInput,
} from '../../components/forms/SimpleForm';
import AttendanceForm from '../../components/forms/usable-forms/AttendanceForm';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import { FetchAPIProps, withFetchApi } from '../../globals';
import Page, { PageProps } from '../Page';
import './EventViewer.css';

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
	accountFilterValues: [string];
	linkEventResult: null | HTTPError | { id: number; accountID: string };
}

type EventViewerState = EventViewerUIState & EventViewerTeamState & EventViewerViewerState;

interface EventViewerProps extends PageProps<{ id: string }>, FetchAPIProps {
	now?: () => number;
}

export const attendanceStatusLabels = [
	'Commited/Attended',
	'Rescinded commitment to attend',
	'No show',
	'Not planning on attending',
];

const getCalendarDate = (inDate: number): string => {
	const dateObject = new Date(inDate);
	const nowObject = new Date();
	return `${dateObject.getMonth()}/${dateObject.getFullYear()}` ===
		`${nowObject.getMonth()}/${nowObject.getFullYear()}`
		? ''
		: `${dateObject.getMonth() + 1}/${dateObject.getFullYear()}`;
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
			Maybe.map((name: string) => `[${name}]`),
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

const getEmails = (renderMember: ClientUser | null) => (
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
	attendance: eventViewer.attendees.map(get('record')),
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

export class EventViewer extends Page<EventViewerProps, EventViewerState> {
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
		accountFilterValues: [''],
		linkEventResult: null,
		openLinkEventDialogue: false,
		selectedAccountToLinkTo: null,
	};

	public async componentDidMount(): Promise<void> {
		const eventInformation = await this.props.fetchApi.events.events.getViewerData(
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
			const teamInfoEither = await this.props.fetchApi.team
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

	public render(): JSX.Element {
		if (this.state.viewerState === 'LOADING') {
			return <Loader />;
		}

		if (this.state.viewerState === 'ERROR') {
			return <div>{this.state.viewerMessage}</div>;
		}

		const now = this.props.now ?? Date.now;

		const eventViewerInfo = this.state.eventInformation;
		const {
			event,
			attendees,
			pointsOfContact,
			authorFullName,
			linkedEvents,
			sourceAccountName,
		} = eventViewerInfo;
		const { member, fullMemberDetails } = this.props;

		const linkableAccounts =
			fullMemberDetails.error !== MemberCreateError.NONE
				? []
				: fullMemberDetails.linkableAccounts.filter(
						({ id }) => !linkedEvents.find(linkedEvent => linkedEvent.accountID === id),
				  );

		const renderDebriefMemberName =
			member &&
			event.debrief.filter(
				val => val.publicView === true && !areMembersTheSame(member)(val.memberRef),
			).length > 0;
		const renderDebriefView =
			member &&
			event.debrief.filter(val => areMembersTheSame(member)(val.memberRef)).length > 0;

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
					effectiveManageEventPermissionForEvent(member)(event) &&
					linkableAccounts.length > 0 &&
					event.type !== EventType.LINKED ? (
						<br />
					) : null}
					{event.type === EventType.LINKED ||
					linkableAccounts.length === 0 ? null : linkableAccounts.length === 1 ? (
						<>
							<Button
								onClick={() => this.linkEventTo(linkableAccounts[0].id)}
								buttonType="none"
							>
								Link event to {linkableAccounts[0].name}
							</Button>
							<Dialogue
								onClose={() => this.setState({ linkEventResult: null })}
								displayButtons={DialogueButtons.OK}
								title="Link event result"
								open={this.state.linkEventResult !== null}
							>
								{this.state.linkEventResult !== null ? (
									'id' in this.state.linkEventResult ? (
										<p>
											Your event has been linked!
											<br />
											<br />
											<a
												// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
												href={`https://${this.state.linkEventResult.accountID}.${process.env.REACT_APP_HOST_NAME}/eventviewer/${this.state.linkEventResult.id}`}
												rel="noopener _blank"
											>
												View it here
											</a>
										</p>
									) : (
										this.state.linkEventResult.message
									)
								) : null}
							</Dialogue>
						</>
					) : (
						<>
							<Button
								buttonType="none"
								onClick={() => this.setState({ openLinkEventDialogue: true })}
							>
								Link event
							</Button>
							<DownloadDialogue<AccountLinkTarget, [string]>
								valuePromise={linkableAccounts}
								displayValue={get('name')}
								multiple={false}
								onValueClick={selectedAccountToLinkTo =>
									this.setState({ selectedAccountToLinkTo })
								}
								onCancel={() => this.setState({ openLinkEventDialogue: false })}
								onValueSelect={info => info && this.linkEventTo(info.id)}
								open={this.state.openLinkEventDialogue}
								title="Select an account"
								selectedValue={this.state.selectedAccountToLinkTo}
								filterValues={this.state.accountFilterValues}
								onFilterValuesChange={accountFilterValues =>
									this.setState({ accountFilterValues })
								}
								filters={
									[
										{
											check: (accountInfo, input) => {
												if (input === '' || typeof input !== 'string') {
													return true;
												}

												try {
													return !!new RegExp(input, 'gi').exec(
														accountInfo.name,
													);
												} catch (e) {
													return false;
												}
											},
											displayText: 'Account name',
											filterInput: TextInput,
										} as CheckInput<AccountLinkTarget, string>,
									] as const
								}
								showIDField={false}
							/>
							<Dialogue
								onClose={() => this.setState({ linkEventResult: null })}
								displayButtons={DialogueButtons.OK}
								title="Link event result"
								open={this.state.linkEventResult !== null}
							>
								{this.state.linkEventResult !== null ? (
									'id' in this.state.linkEventResult ? (
										<p>
											Your event has been linked!
											<br />
											<br />
											<a
												// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
												href={`https://${this.state.linkEventResult.accountID}.${process.env.REACT_APP_HOST_NAME}/eventviewer/${this.state.linkEventResult.id}`}
												rel="noopener _blank"
											>
												View it here
											</a>
										</p>
									) : (
										this.state.linkEventResult.message
									)
								) : null}
							</Dialogue>
							{member &&
							effectiveManageEventPermissionForEvent(member)(event) >=
								Permissions.ManageEvent.FULL
								? ' | '
								: null}
						</>
					)}
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
						{event.type === EventType.LINKED ? (
							<>
								<strong>
									<a
										// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
										href={`https://${event.targetAccountID}.${process.env.REACT_APP_HOST_NAME}/eventviewer/${event.targetEventID}`}
										rel="noopener _blank"
									>
										Event linked from{' '}
										{sourceAccountName ?? event.targetAccountID.toUpperCase()}
									</a>
								</strong>
								<br />
								<br />
							</>
						) : null}
						{linkedEvents.length > 0 ? (
							<>
								<h4>Events linked to this event</h4>
								<ul>
									{linkedEvents.map(
										({ id, accountID, name, accountName }, index) => (
											<li key={index}>
												<a
													// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
													href={`https://${accountID}.${process.env.REACT_APP_HOST_NAME}/eventviewer/${id}`}
													target="noopener _blank"
												>
													{accountName} - {name}
												</a>
											</li>
										),
									)}
								</ul>
							</>
						) : null}
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
						(event.pickupDateTime < new Date().getTime() ||
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
						{pipe(
							(renderedMeals: JSX.Element[]) =>
								renderedMeals.length === 0
									? Maybe.none()
									: Maybe.some(renderedMeals),
							Maybe.map<JSX.Element[], JSX.Element>(renderedMeals => (
								<>
									<strong>Meals Description:</strong>
									<ul>
										{renderedMeals.map((meal, index) => (
											<li key={index}>{meal}</li>
										))}
									</ul>
								</>
							)),
							Maybe.orSome<JSX.Element | null>(null),
						)(advancedMultCheckboxReturn(event.mealsDescription, this.renderMeals))}
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
										{event.debrief.flatMap(debriefElement => [
											<tr key={debriefElement.timeSubmitted}>
												<td>{formatDate(debriefElement.timeSubmitted)}</td>
												<td>{debriefElement.memberName}</td>
												<td>{debriefElement.publicView ? 'All' : 'Mgr'}</td>
												<td>{debriefElement.debriefText}</td>
												<td>
													<DialogueButton
														buttonText="Delete"
														buttonType="none"
														buttonClass="underline-button"
														displayButtons={DialogueButtons.OK_CANCEL}
														onOk={this.deleteDebriefCallbackForTimeSubmitted(
															debriefElement.timeSubmitted,
														)}
														title="Delete debrief item"
														labels={['Yes', 'No']}
													>
														Do you really want to delete this debrief
														item?
													</DialogueButton>
												</td>
											</tr>,
										])}
									</table>
								</div>
							</>
						) : event.debrief.length > 0 ? (
							<>
								<div className="debrieflist">
									<h3>Debrief Items</h3>
									<table>
										<tr>
											<th>Time Submitted</th>
											{renderDebriefMemberName ? <th>MemberName</th> : null}
											{renderDebriefView ? <th>View</th> : null}
											<th>Text</th>
										</tr>
										{event.debrief.flatMap(debriefElement => [
											<tr key={debriefElement.timeSubmitted}>
												<td>{formatDate(debriefElement.timeSubmitted)}</td>
												{renderDebriefMemberName ? (
													<td>{debriefElement.memberName}</td>
												) : null}
												{renderDebriefView ? (
													<td>
														{debriefElement.publicView ? 'All' : 'Mgr'}
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
										{poc.position ? (
											<>
												<b>Event Duty Position: </b>
												{poc.position}
												<br />
											</>
										) : null}
										{member && !!poc.email ? (
											<>
												<b>CAP Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{member && !!poc.phone ? (
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
										{poc.position ? (
											<>
												<b>Event Duty Position: </b>
												{poc.position}
												<br />
											</>
										) : null}
										{member && poc.email !== '' ? (
											<>
												<b>External Point of Contact Email: </b>
												{poc.email}
												<br />
											</>
										) : null}
										{member && poc.phone !== '' ? (
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
										now() < event.pickupDateTime ? (
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
										rec => rec.record.memberID.type === 'CAPNHQMember',
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
									{attendees.length > 0 &&
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
												val => val.record.memberID.type === 'CAPNHQMember',
											)
											.map(rec => rec.record.memberID.id)
											.join(', ')}
									</Dialogue>
									<Dialogue
										displayButtons={DialogueButtons.OK}
										open={this.state.showingemails}
										title="Emails"
										onClose={() => this.setState({ showingemails: false })}
									>
										{this.state.eventInformation.attendees
											.map(getEmails(member))
											.join(', ')}
									</Dialogue>
									<DropDownList<api.events.events.EventViewerAttendanceRecord>
										titles={renderName(member)(event)}
										values={attendees}
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

	private modifyAttendanceRecord = (
		record: Required<NewAttendanceRecord>,
		member: Member | null,
	): void => {
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
								member === null || !areMembersTheSame(member)(rec.record.memberID)
									? rec
									: {
											member: Maybe.fromValue(member),
											orgName: Maybe.some(this.props.registry.Website.Name),
											record: {
												...record,
												timestamp: rec.record.timestamp,
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
													Maybe.map(getFullMemberName)(
														Maybe.fromValue(member),
													),
												),
											},
									  },
							),
						},
				  }
				: prev,
		);
	};

	private addAttendanceRecord = (record: Required<NewAttendanceRecord>): void => {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		const member = this.props.member;

		this.setState(prev =>
			prev.viewerState === 'LOADED'
				? {
						...prev,

						previousUpdatedMember: Maybe.some(record.memberID),
						eventInformation: {
							...prev.eventInformation,
							attendees: [
								...prev.eventInformation.attendees,
								{
									record: {
										...record,
										timestamp: (this.props.now ?? Date.now)(),
										summaryEmailSent: false,
										sourceAccountID: this.props.account.id,
										sourceEventID: prev.eventInformation.event.id,
										shiftTime: record.shiftTime ?? {
											arrivalTime: prev.eventInformation.event.pickupDateTime,
											departureTime: prev.eventInformation.event.meetDateTime,
										},
										memberName: getFullMemberName(member),
									},
									member: Maybe.fromValue(this.props.member),
									orgName: Maybe.some(this.props.registry.Website.Name),
								},
							],
						},
				  }
				: prev,
		);
	};

	private removeAttendanceRecord = (record: AttendanceRecord): void => {
		this.setState(prev =>
			prev.viewerState !== 'LOADED'
				? prev
				: {
						...prev,
						eventInformation: {
							...prev.eventInformation,
							attendees: prev.eventInformation.attendees.filter(
								mem => !areMembersTheSame(mem.record.memberID)(record.memberID),
							),
						},
				  },
		);
	};

	private clearPreviousMember = (): void => {
		this.setState({
			previousUpdatedMember: Maybe.none(),
		});
	};

	private moveEvent = async ({ newTime }: { newTime: number }): Promise<void> => {
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

		await this.props.fetchApi.events.events.set({ id: event.id.toString() }, newEvent);

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
	};

	private addDebrief = async ({
		debriefText,
		publicView,
	}: {
		debriefText: string;
		publicView: boolean;
	}): Promise<void> => {
		const state = this.state;
		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to add debrief to a null event');
		}

		const mem = this.props.member;
		if (!mem) {
			return;
		}

		const { event } = state.eventInformation;
		await AsyncEither.All([
			this.props.fetchApi.events.debrief.add(
				{ id: event.id.toString() },
				{ debriefText, publicView },
			),
		]);

		this.setState(prev =>
			prev.viewerState === 'LOADED'
				? {
						...prev,

						eventInformation: {
							...prev.eventInformation,
							event: {
								...prev.eventInformation.event,
								debrief: [
									...prev.eventInformation.event.debrief,
									{
										debriefText,
										memberName: getFullMemberName(mem),
										memberRef: toReference(mem),
										publicView,
										timeSubmitted: (this.props.now ?? Date.now)(),
									},
								],
							},
						},
				  }
				: prev,
		);
	};

	private deleteDebriefCallbackForTimeSubmitted = (timeSubmitted: number) => async () => {
		const state = this.state;
		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to add debrief to a null event');
		}

		if (!this.props.member) {
			return;
		}

		const { event } = state.eventInformation;
		await AsyncEither.All([
			this.props.fetchApi.events.debrief.delete(
				{ id: event.id.toString(), timestamp: timeSubmitted.toString() },
				{},
			),
		]);

		this.setState(prev =>
			prev.viewerState === 'LOADED'
				? {
						...prev,

						eventInformation: {
							...prev.eventInformation,
							event: {
								...prev.eventInformation.event,
								debrief: prev.eventInformation.event.debrief.filter(
									item => item.timeSubmitted !== timeSubmitted,
								),
							},
						},
				  }
				: prev,
		);
	};

	private copyMoveEvent = async ({
		newTime,
		copyFiles,
	}: {
		newTime: number;
		copyFiles: boolean;
	}): Promise<void> => {
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
			this.props.fetchApi.events.events.set({ id: event.id.toString() }, newEvent),
			this.props.fetchApi.events.events.copy(
				{ id: event.id.toString() },
				{ newTime, copyFiles, newStatus: event.status },
			),
		]);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/eventviewer/${result.value[1].id}`);
		}
	};

	private copyEvent = async ({
		newTime,
		copyFiles,
		newStatus,
	}: {
		newTime: number;
		copyFiles: boolean;
		newStatus: EventStatus;
	}): Promise<void> => {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const result = await this.props.fetchApi.events.events.copy(
			{ id: state.eventInformation.event.id.toString() },
			{ newTime, copyFiles, newStatus },
		);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/eventviewer/${result.value.id}`);
		}
	};

	private deleteEvent = async (): Promise<void> => {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const result = await this.props.fetchApi.events.events.delete(
			{ id: state.eventInformation.event.id.toString() },
			{},
		);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/calendar/`);
		}
	};

	private renderFormsButtons = (formName: string): JSX.Element => {
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
	};

	private renderMeals = (mealName: string): JSX.Element => {
		{
			return <>{mealName}</>;
		}
	};

	private createCAPF6080 = async (): Promise<void> => {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		const docDef = forms.capf6080DocumentDefinition(
			this.state.eventInformation.event,
			this.state.eventInformation.pointsOfContact,
			this.props.member,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			process.env.REACT_APP_HOST_NAME!,
		);

		await this.printForm(
			docDef,
			`CAPF6080-${this.props.account.id}-${this.state.eventInformation.event.id}.pdf`,
		);
	};

	private async printForm(docDef: TDocumentDefinitions, fileName: string): Promise<void> {
		const pdfMake = await import('pdfmake');

		const fontGetter =
			process.env.NODE_ENV === 'production'
				? (fontName: string) =>
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						`https://${this.props.account.id}.${process.env
							.REACT_APP_HOST_NAME!}/images/fonts/${fontName}`
				: (fontName: string) => `http://localhost:3000/images/fonts/${fontName}`;

		const fonts: TFontDictionary = {
			FreeSans: {
				normal: fontGetter('FreeSans.ttf'),
				bold: fontGetter('FreeSansBold.ttf'),
				italics: fontGetter('FreeSansOblique.ttf'),
				bolditalics: fontGetter('FreeSansBoldOblique.ttf'),
			},
		};

		// @ts-ignore: the types lie, as has been verified with tests
		const docPrinter = (pdfMake.createPdf as (
			def: TDocumentDefinitions,
			idk: null,
			fontDictionary: TFontDictionary,
		) => { download(filename: string): void })(docDef, null, fonts);

		docPrinter.download(fileName);
	}

	private createAttendanceSpreadsheet = async (): Promise<void> => {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		const XLSX = await import('xlsx');

		const wb = XLSX.utils.book_new();
		const evtID = `${this.state.eventInformation.event.accountID}-${this.state.eventInformation.event.id}`;

		let wsName = 'EventInfo';
		const wsDataEvent = spreadsheets.EventXL(this.state.eventInformation.event);
		let ws = XLSX.utils.aoa_to_sheet(wsDataEvent);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let sheet = spreadsheets.FormatEventXL(evtID, ws, process.env.REACT_APP_HOST_NAME!);
		XLSX.utils.book_append_sheet(wb, sheet, wsName);

		wsName = 'Attendance';
		const [wsDataAttendance, widths] = spreadsheets.AttendanceXL(
			this.state.eventInformation.event,
			this.state.eventInformation.attendees,
		);
		ws = XLSX.utils.aoa_to_sheet(wsDataAttendance);
		sheet = spreadsheets.FormatAttendanceXL(
			ws,
			widths,
			this.state.eventInformation.event.customAttendanceFields,
			address => XLSX.utils.encode_cell(address),
			wsDataAttendance.length,
		);
		XLSX.utils.book_append_sheet(wb, sheet, wsName);

		const now = new Date();
		const formatdate =
			now.getFullYear().toString() +
			'-' +
			(now.getMonth() + 1).toString().padStart(2, '0') +
			'-' +
			now.getDate().toString().padStart(2, '0') +
			' ' +
			now.getHours().toString().padStart(2, '0') +
			now.getMinutes().toString().padStart(2, '0');

		XLSX.writeFile(wb, `Attendance ${evtID} ${formatdate}.xlsx`);
	};

	private async linkEventTo(targetaccount: string): Promise<void> {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		this.setState({
			openLinkEventDialogue: false,
		});

		const result = await this.props.fetchApi.events.events.link(
			{ eventid: this.state.eventInformation.event.id.toString(), targetaccount },
			{},
		);

		if (Either.isLeft(result)) {
			this.setState({
				linkEventResult: result.value,
			});
		} else {
			this.setState({
				linkEventResult: {
					accountID: result.value.accountID,
					id: result.value.id,
				},
			});
		}
	}
}

export default withFetchApi(EventViewer);
