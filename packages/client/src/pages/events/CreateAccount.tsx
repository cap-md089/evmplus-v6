/**
 * Copyright (C) 2020 Andrew Rioux
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
	AccountObject,
	AccountType,
	AsyncEither,
	Either,
	FullTeamObject,
	getORGIDsFromCAPAccount,
	isCAPMember,
	isRioux,
	Maybe,
	MaybeObj,
	Member,
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import SimpleForm, { Label, TextInput } from '../../components/forms/SimpleForm';
import EventForm, {
	convertFormValuesToEvent,
	emptyEventFormValues,
	NewEventFormValues,
} from '../../components/forms/usable-forms/EventForm';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

const calendarIDStyles = {
	backgroundColor: 'gray',
	color: 'black',
	display: 'inline-block',
	padding: '3px',
	fontSize: '1.1em',
};

interface CreateAccountLoadingState {
	state: 'LOADING';
}

interface CreateAccountFormState {
	state: 'FORM';

	event: NewEventFormValues;
	memberList: Member[];
	teamList: FullTeamObject[];
	newAccountID: string;
	newAccountName: string;
}

interface CreateAccountSavingState {
	state: 'SAVING';
}

interface CreateAccountResultState {
	state: 'CREATED';

	account: AccountObject;
}

interface CreateAccountErrorState {
	state: 'ERROR';

	error: string;
}

type CreateAccountState =
	| CreateAccountLoadingState
	| CreateAccountFormState
	| CreateAccountSavingState
	| CreateAccountResultState
	| CreateAccountErrorState;

export default class CreateAccount extends Page<PageProps, CreateAccountState> {
	public state: CreateAccountState = {
		state: 'LOADING',
	};

	constructor(props: PageProps) {
		super(props);

		this.updateNewEvent = this.updateNewEvent.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public async componentDidMount() {
		this.props.updateSideNav([
			{
				target: 'main-information',
				text: 'Main information',
				type: 'Reference',
			},
			{
				target: 'activity-information',
				text: 'Activity Information',
				type: 'Reference',
			},
			{
				target: 'logistics-information',
				text: 'Logistics Information',
				type: 'Reference',
			},
			{
				target: 'points-of-contact',
				text: 'Points of Contact',
				type: 'Reference',
			},
			{
				target: 'custom-attendance-fields',
				text: 'Custom Attendance Fields',
				type: 'Reference',
			},
			{
				target: 'extra-information',
				text: 'Extra Information',
				type: 'Reference',
			},
			{
				target: 'team-information',
				text: 'Team Information',
				type: 'Reference',
			},
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Admin',
			},
			{
				target: '/admin/createeventaccount',
				text: 'Create event account',
			},
		]);
		this.updateTitle('Create event');

		if (!this.props.member) {
			return;
		}

		const infoEither = await AsyncEither.All([
			fetchApi.member.memberList({}, {}, this.props.member.sessionID),
			fetchApi.team.list({}, {}, this.props.member.sessionID),
		]);

		if (Either.isLeft(infoEither)) {
			return this.setState({
				state: 'ERROR',

				error: infoEither.value.message,
			});
		}

		const [memberList, teamList] = infoEither.value;

		this.setState({
			state: 'FORM',

			event: emptyEventFormValues(),
			memberList,
			teamList,
			newAccountID: `${this.props.account.id}-`,
			newAccountName: '',
		});
	}

	public get hasPermission() {
		if (!this.props.member) {
			return false;
		}

		if (isRioux(this.props.member)) {
			return true;
		}

		if (!isCAPMember(this.props.member)) {
			return false;
		}

		const duties = this.props.member.dutyPositions
			.filter(
				duty =>
					duty.type === 'CAPUnit' ||
					Maybe.orSome<number[]>([])(
						getORGIDsFromCAPAccount(this.props.account),
					).includes(duty.orgid),
			)
			.map(({ duty }) => duty);

		return (
			this.props.account.type === AccountType.CAPWING &&
			(duties.includes('Commander') || duties.includes('Information Technologies Officer'))
		);
	}

	public render() {
		if (this.state.state === 'SAVING' || this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.error}</div>;
		}

		if (this.state.state === 'CREATED') {
			return (
				<div>
					Your event and accompanying account have been created!
					<br />
					<br />
					You can visit your new account{' '}
					<a
						href={`https://${this.state.account.id}.${process.env.REACT_APP_HOST_NAME}/`}
						rel="_blank noopener"
					>
						here
					</a>
					. Please also take some time to configure your new site{' '}
					<a
						href={`https://${this.state.account.id}.${process.env.REACT_APP_HOST_NAME}/regedit`}
						rel="_blank noopener"
					>
						here
					</a>
					.
					<br />
					<br />A Google calendar has been created for this account; it's ID is
					<span style={calendarIDStyles}>{this.state.account.mainCalendarID}</span>.
				</div>
			);
		}

		return this.props.member && this.hasPermission ? (
			<>
				<div>
					This form is used to create an event that fits at least one of the following
					categories:
					<ul>
						<li>The event requires its own staff</li>
						<li>
							The event has several sub-events that the wing doesn't want hosted on
							its calendar, but still wants to have the overarching event on its
							calendar
						</li>
						<li>The event requires its own Discord server</li>
					</ul>
					If your event doesn't fill out any of these categories, consider creating a
					normal event <Link to="/addevent">here</Link>.
					<br />
					<br />
					The account ID is the part of the URL that points to a specific unit or
					activity. For example, your current account ID is "{this.props.account.id}". An
					account ID will be required to make a new account, and it will have to start
					with "{this.props.account.id}".
					<br />
					<br />
					If the event is a yearly event, (e.g., encampments) it is recommended you attach
					the year to the account ID, as you cannot delete these accounts. The year is not
					needed in the website name.
					<br />
					<br />
					If you are hosting a yearly event and want an alias, for instance mdtwe to point
					to md001twe2020, then please email{' '}
					<a href="mailto:support@evmplus.org">support@evmplus.org</a> to request an alias
					or to request that an alias is reassigned. For instance, you can request to
					reassign the alias "mdtwe" from "md001twe2020" to "md001twe2021". The longer ID
					will still be required, however. You will be able to request multiple aliases.
					<br />
					<br />
					<br />
				</div>

				<SimpleForm<{ accountName: string; accountID: string }>
					values={{
						accountName: this.state.newAccountName,
						accountID: this.state.newAccountID,
					}}
					validator={{
						accountName: name => name !== '',
						accountID: id =>
							id !== this.props.account.id || id.startsWith(this.props.account.id),
					}}
					showSubmitButton={false}
					onChange={({ accountName, accountID }) =>
						this.setState(prev =>
							prev.state === 'FORM'
								? {
										...prev,
										state: 'FORM',
										newAccountID: accountID,
										newAccountName: accountName,
								  }
								: prev,
						)
					}
				>
					<Label>New account ID</Label>
					<TextInput
						name="accountID"
						errorMessage={`Account ID must start with "${this.props.account.id}"`}
					/>

					<Label>New website name</Label>
					<TextInput name="accountName" errorMessage="Account name cannot be empty" />
				</SimpleForm>

				<EventForm
					account={this.props.account}
					member={this.props.member}
					event={this.state.event}
					isEventUpdate={false}
					onEventChange={this.updateNewEvent}
					onEventFormSubmit={this.handleSubmit}
					registry={this.props.registry}
					teamList={this.state.teamList}
					memberList={this.state.memberList}
					saving={false}
					formDisabled={
						!this.state.newAccountID.startsWith(this.props.account.id) ||
						this.state.newAccountName === ''
					}
				/>
			</>
		) : !this.hasPermission ? (
			<div>You cannot perform this action</div>
		) : (
			<div>Please sign in</div>
		);
	}

	private async handleSubmit(event: MaybeObj<NewEventFormValues>) {
		if (this.state.state !== 'FORM') {
			return;
		}

		if (!this.props.member) {
			return;
		}

		if (!event.hasValue) {
			return;
		}

		const realEventMaybe = Maybe.flatMap(convertFormValuesToEvent)(event);

		if (!realEventMaybe.hasValue) {
			return;
		}

		const newEvent = realEventMaybe.value;

		this.setState({
			state: 'SAVING',
		});

		const accountResult = await fetchApi.events.account.create(
			{},
			{
				accountID: this.state.newAccountID,
				accountName: this.state.newAccountName,
				event: newEvent,
			},
			this.props.member.sessionID,
		);

		if (Either.isLeft(accountResult)) {
			this.setState({
				state: 'ERROR',
				error: accountResult.value.message,
			});
		} else {
			this.setState({
				state: 'CREATED',
				account: accountResult.value,
			});
		}
	}

	private updateNewEvent(event: NewEventFormValues) {
		this.setState(prev => ({
			...prev,
			state: 'FORM',
			event,
		}));
	}
}
