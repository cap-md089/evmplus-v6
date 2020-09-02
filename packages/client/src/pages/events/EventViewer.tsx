/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
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
	CAPNHQMemberReference,
	effectiveManageEventPermissionForEvent,
	Either,
	EitherObj,
	EventObject,
	EventStatus,
	formatEventViewerDate as formatDate,
	forms,
	FullTeamObject,
	get,
	getMemberEmail,
	getMemberName,
	getMemberPhone,
	getURIComponent,
	HTTPError,
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
	RawEventObject,
	Right,
	spreadsheets,
	stringifyMemberReference,
	User,
} from 'common-lib';
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import * as React from 'react';
import { Link } from 'react-router-dom';
import AttendanceItemView from '../../components/AttendanceView';
import Button from '../../components/Button';
import Dialogue, { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButton from '../../components/dialogues/DialogueButton';
import DialogueButtonForm from '../../components/dialogues/DialogueButtonForm';
import DownloadDialogue from '../../components/dialogues/DownloadDialogue';
import DropDownList from '../../components/DropDownList';
import { DateTimeInput, Label, TextBox, TextInput } from '../../components/forms/SimpleForm';
import AttendanceForm from '../../components/forms/usable-forms/AttendanceForm';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import fetchApi from '../../lib/apis';
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
	cadetRoster: Member[] | null;
	seniorRoster: Member[] | null;
	eventRegistry: boolean;
	showingCAPIDs: boolean;
	openLinkEventDialogue: boolean;
	selectedAccountToLinkTo: AccountLinkTarget | null;
	accountFilterValues: any[];
	linkEventResult: null | HTTPError | { id: number; accountID: string };
}

type EventViewerState = EventViewerUIState & EventViewerTeamState & EventViewerViewerState;

type EventViewerProps = PageProps<{ id: string }>;

const eventStatus = (stat: EventStatus): string =>
	stat === EventStatus.COMPLETE
		? 'Complete'
		: stat === EventStatus.CANCELLED
		? 'Cancelled'
		: stat === EventStatus.CONFIRMED
		? 'Confirmed'
		: stat === EventStatus.DRAFT
		? 'Draft'
		: stat === EventStatus.INFORMATIONONLY
		? 'Information Only'
		: stat === EventStatus.TENTATIVE
		? 'Tentative'
		: '';

export const attendanceStatusLabels = [
	'Commited/Attended',
	'No show',
	'Rescinded commitment to attend',
];

const renderName = (renderMember: User | null) => (event: RawEventObject) => (
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
		cadetRoster: null,
		seniorRoster: null,
		eventRegistry: false,
		showingCAPIDs: false,
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

		this.renderFormsButtons = this.renderFormsButtons.bind(this);
		this.createCAPF6080 = this.createCAPF6080.bind(this);
		this.createAttendanceSpreadsheet = this.createAttendanceSpreadsheet.bind(this);
	}

	public async componentDidMount() {
		const eventInformation = await fetchApi.events.events.getViewerData(
			{ id: this.props.routeProps.match.params.id.split('-')[0] },
			{},
			this.props.member?.sessionID,
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
				target: '/calendar',
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
				.get({ id: event.teamID.toString() }, {}, this.props.member?.sessionID)
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
		const {
			event,
			attendees,
			pointsOfContact,
			sourceAccountName,
			linkedEvents,
		} = eventViewerInfo;
		const { member, fullMemberDetails } = this.props;

		const linkableAccounts =
			fullMemberDetails.error !== MemberCreateError.NONE
				? []
				: fullMemberDetails.linkableAccounts.filter(
						({ id }) => !linkedEvents.find(linkedEvent => linkedEvent.accountID === id),
				  );

		return (
			<>
				<div className="eventviewerroot">
					{member &&
					effectiveManageEventPermissionForEvent(member)(event) !==
						Permissions.ManageEvent.NONE ? (
						<>
							<Link to={`/eventform/${event.id}`}>Edit event "{event.name}"</Link>
							{' | '}
							<DialogueButtonForm<{ newTime: number }>
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

								<Label>New start time of event</Label>
								<DateTimeInput
									name="newTime"
									time={true}
									originalTimeZoneOffset={'America/New_York'}
								/>
							</DialogueButtonForm>
							{' | '}
							<DialogueButtonForm<{ newTime: number }>
								buttonText="Copy event"
								buttonType="none"
								buttonClass="underline-button"
								displayButtons={DialogueButtons.OK_CANCEL}
								onOk={this.copyEvent}
								title="Copy event"
								labels={['Copy event', 'Cancel']}
								values={{
									newTime: event.startDateTime,
								}}
							>
								<Label>Start time of new event</Label>
								<DateTimeInput
									name="newTime"
									time={true}
									originalTimeZoneOffset={'America/New_York'}
								/>
							</DialogueButtonForm>
							{' | '}
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
							<Link to={`/multiadd/${event.id}`}>Add attendance</Link>
							{/* {' | '}
							<Link to={`/scanadd/${event.id}`}>Scan Add attendance</Link> */}
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
					!event.sourceEvent
						? ' | '
						: null}
					{!!event.sourceEvent ||
					linkableAccounts.length === 0 ? null : linkableAccounts.length === 1 ? (
						<Button
							onClick={() => this.linkEventTo(linkableAccounts[0].id)}
							buttonType="none"
						>
							Link event to {linkableAccounts[0].name}
						</Button>
					) : (
						<>
							<Button
								buttonType="none"
								onClick={() => this.setState({ openLinkEventDialogue: true })}
							>
								Link event
							</Button>
							<DownloadDialogue
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
								filters={[
									{
										check: (accountInfo, input) => {
											if (input === '' || typeof input !== 'string') {
												return true;
											}

											try {
												return !!accountInfo.name.match(
													new RegExp(input, 'gi'),
												);
											} catch (e) {
												return false;
											}
										},
										displayText: 'Account name',
										filterInput: TextInput,
									},
								]}
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
												href={`https://${this.state.linkEventResult.accountID}.capunit.com/eventviewer/${this.state.linkEventResult.id}`}
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
					effectiveManageEventPermissionForEvent(member)(event) >=
						Permissions.ManageEvent.FULL ? (
						<Link to={`/events/scanadd/${event.id}`}>Attendance scanner</Link>
					) : null}
					{(member && effectiveManageEventPermissionForEvent(member)(event)) ||
					(fullMemberDetails.error === MemberCreateError.NONE &&
						fullMemberDetails.linkableAccounts.length > 0 &&
						event.sourceEvent === null) ? (
						<>
							<br />
							<br />
						</>
					) : null}
					<div id="information">
						{event.sourceEvent ? (
							<>
								<strong>
									<a
										href={`https://${event.sourceEvent.accountID}.capunit.com/eventviewer/${event.sourceEvent.id}`}
										rel="noopener _blank"
									>
										Event linked from{' '}
										{sourceAccountName ??
											event.sourceEvent.accountID.toUpperCase()}
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
													href={`https://${accountID}.capunit.com/eventviewer/${id}`}
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
						<h2>Meeting information</h2>
						<strong>Event ID: </strong> {event.accountID.toUpperCase()}-{event.id}
						<br />
						<strong>Meet</strong> at {formatDate(event.meetDateTime)} at{' '}
						{event.location}
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
						<strong>Comments:</strong> {event.comments}
						<br />
						<strong>Activity:</strong>{' '}
						{pipe(
							Maybe.map(activities => <>{activities}</>),
							Maybe.orSome(<i>Unknown activity type</i>),
						)(presentMultCheckboxReturn(event.activity))}
						<br />
						<strong>Required forms:</strong>{' '}
						{pipe(
							(renderedForms: JSX.Element[]) =>
								renderedForms.length === 0
									? Maybe.none()
									: Maybe.some(renderedForms),
							Maybe.map<JSX.Element[], Array<JSX.Element | null>>(renderedForms =>
								renderedForms.flatMap((form, index, { length }) => [
									React.cloneElement(form, { key: index }),
									index < length - 1 ? <>, </> : null,
								]),
							),
							Maybe.orSome<Array<JSX.Element | null>>([
								<i key={0}>No forms required</i>,
							]),
						)(advancedMultCheckboxReturn(event.requiredForms, this.renderFormsButtons))}
						<br />
						{event.requiredEquipment.length > 0 ? (
							<>
								<strong>Required equipment:</strong>{' '}
								{event.requiredEquipment.join(', ')}
								<br />
							</>
						) : null}
						<strong>Event status:</strong> {eventStatus(event.status)}
						<br />
						<strong>Desired number of participants:</strong>{' '}
						{event.desiredNumberOfParticipants}
						<h2>Contact information</h2>
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
								{this.state.eventInformation.attendees.some(
									rec =>
										Either.isRight(rec) &&
										rec.value.record.memberID.type === 'CAPNHQMember',
								) ? (
									<Button
										buttonType="none"
										onClick={() => this.setState({ showingCAPIDs: true })}
									>
										Show CAP IDs
									</Button>
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
												val.value.record.memberID.type === 'CAPNHQMember',
										)
										.flatMap((rec, i) => [
											(rec.value.record.memberID as CAPNHQMemberReference).id,
											i < attendees.length - 1 ? ', ' : null,
										])}
								</Dialogue>
								<div id="signup">
									{Either.cata<string, void, React.ReactElement | null>(err =>
										err !== 'Member is already in attendance' ? (
											<p>Cannot sign up for event: {err}</p>
										) : null,
									)(() => (
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
									))(
										canEitherMaybeSignUpForEvent(eventViewerInfo)(
											this.state.teamInformation,
										)(member),
									)}
									<h2 id="attendance">Attendance</h2>
									<DropDownList<api.events.events.EventViewerAttendanceRecord>
										titles={renderName(member)(event)}
										values={attendees.filter(Either.isRight).map(get('value'))}
										onlyOneOpen={true}
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
												key={i}
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

		await fetchApi.events.events.set(
			{ id: event.id.toString() },
			newEvent,
			this.props.member.sessionID,
		);

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

	private async copyMoveEvent({ newTime }: { newTime: number }) {
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
			fetchApi.events.events.set(
				{ id: event.id.toString() },
				newEvent,
				this.props.member.sessionID,
			),
			fetchApi.events.events.copy(
				{ id: event.id.toString() },
				{ newTime, copyStatus: false, copyFiles: false },
				this.props.member.sessionID,
			),
		]);

		if (Either.isRight(result)) {
			this.props.routeProps.history.push(`/eventviewer/${result.value[1].id}`);
		}
	}

	private async copyEvent({ newTime }: { newTime: number }) {
		const state = this.state;

		if (state.viewerState !== 'LOADED') {
			throw new Error('Attempting to move a null event');
		}

		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.events.events.copy(
			{ id: state.eventInformation.event.id.toString() },
			{ newTime, copyStatus: false, copyFiles: false },
			this.props.member.sessionID,
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
			this.props.member.sessionID,
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
						`https://${this.props.account.id}.capunit.com/images/fonts/${fontName}`
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
		let sheet = spreadsheets.FormatEventXL(evtID, ws);
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

	private async linkEventTo(targetaccount: string) {
		if (this.state.viewerState !== 'LOADED' || !this.props.member) {
			return;
		}

		this.setState({
			openLinkEventDialogue: false,
		});

		const result = await fetchApi.events.events.link(
			{ eventid: this.state.eventInformation.event.id.toString(), targetaccount },
			{},
			this.props.member.sessionID,
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
