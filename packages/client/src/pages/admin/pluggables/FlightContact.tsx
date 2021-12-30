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
	areMembersTheSame,
	CAPMember,
	CAPMemberReference,
	Either,
	get,
	getFullMemberName,
	getMemberEmail,
	hasOneDutyPosition,
	isCAPMember,
	Maybe as M,
	Maybe,
	Member,
	MemberObject,
	pipe,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import Selector, {
	CheckInput,
	SelectorPropsMultiple,
} from '../../../components/form-inputs/Selector';
import SimpleForm, {
	Checkbox,
	Label,
	SimpleRadioButton,
	TextInput,
} from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import './FlightContact.css';

const isMaybeFlightStaff = pipe(
	M.filterType<Member, CAPMember>(isCAPMember),
	M.filter(hasOneDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])),
	M.isSome,
);

const isFlightStaff = (member: Member | undefined | null): member is CAPMember =>
	isMaybeFlightStaff(M.fromValue(member));

const hasAllowedDutyPosition = hasOneDutyPosition([
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Commander',
	'Cadet Element Leader',
	'Cadet First Sergeant',
	'Cadet Deputy Commander',
	'Cadet Executive Officer',
	'Deputy Commander For Cadets',
]);

export const shouldRenderFlightContactWidget = (props: PageProps): boolean =>
	!!props.member &&
	isCAPMember(props.member) &&
	!props.member.seniorMember &&
	hasAllowedDutyPosition(props.member);

interface FlightContactLoadingState {
	state: 'LOADING';
}

interface FlightContactLoadedState {
	state: 'LOADED';

	members: CAPMemberReference[];
}

interface FlightContactErrorState {
	state: 'ERROR';

	message: string;
}

type FlightContactState =
	| FlightContactErrorState
	| FlightContactLoadedState
	| FlightContactLoadingState;

export class FlightContactWidget extends Page<PageProps, FlightContactState> {
	public state: FlightContactState = {
		state: 'LOADING',
	};

	public async componentDidMount(): Promise<void> {
		if (
			this.props.member &&
			isCAPMember(this.props.member) &&
			!this.props.member.seniorMember &&
			hasAllowedDutyPosition(this.props.member)
		) {
			const memberEither = await fetchApi.member.flight.membersBasic({}, {});

			if (Either.isLeft(memberEither)) {
				this.setState({
					state: 'ERROR',
					message: memberEither.value.message,
				});
			} else {
				this.setState({
					state: 'LOADED',
					members: memberEither.value.filter(Either.isRight).map(get('value')),
				});
			}
		}
	}

	public render = (): JSX.Element => (
		<div className="widget">
			<Link
				to={`/admin/${
					isFlightStaff(this.props.member) ? 'flightcontact' : 'squadroncontact'
				}`}
			>
				<div className="widget-title">Flight Contact</div>
			</Link>
			<div className="widget-body">
				{this.state.state === 'LOADING' ? (
					<LoaderShort />
				) : this.state.state === 'ERROR' ? (
					<div>{this.state.message}</div>
				) : (
					<div>
						There {this.state.members.length === 1 ? 'is' : 'are'}{' '}
						{this.state.members.length} member
						{this.state.members.length === 1 ? '' : 's'} in your{' '}
						{isFlightStaff(this.props.member) ? 'flight' : 'unit'}
						<br />
						<br />
						<Link
							to={`/admin/${
								isFlightStaff(this.props.member)
									? 'flightcontact'
									: 'squadroncontact'
							}`}
						>
							Connect with them
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

const memberRanks = [
	'cab',
	'camn',
	'ca1c',
	'csra',
	'cssgt',
	'ctsgt',
	'cmsgt',
	'csmsgt',
	'ccmsgt',
	'c2dlt',
	'c1stlt',
	'ccapt',
	'cmaj',
	'cltcol',
	'ccol',
	'sm',
	'2dlt',
	'1stlt',
	'capt',
	'maj',
	'ltcol',
	'col',
	'briggen',
	'majgen',
	'ltgen',
	'gen',
];

const normalizeRankInput = (rank: string): string =>
	(rank || '')
		.toLowerCase()
		.replace('/', '')
		.replace('2nd', '2d')
		.replace(' ', '')
		.replace('.', '');

interface EmailListLoadingState {
	state: 'LOADING';
}

interface EmailListErrorState {
	state: 'ERROR';

	message: string;
}

interface EmailListLoadedState {
	state: 'LOADED';

	members: Member[];
}

interface EmailListUIState {
	selectedMembers: Member[];
	sortFunction: SortFunction;
	visibleItems: Member[];
	displayAdvanced: boolean;
	filterValues: {
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		flightInput: string;
	};
}

type EmailListState = EmailListUIState &
	(EmailListLoadedState | EmailListLoadingState | EmailListErrorState);

enum SortFunction {
	LASTNAME,
	FIRSTNAME,
	CAPID,
}

const sortFunctions: Array<(a: Member, b: Member) => number> = [
	(a, b) => a.nameLast.localeCompare(b.nameLast),
	(a, b) => a.nameFirst.localeCompare(b.nameFirst),
	(a, b) => a.id.toString().localeCompare(b.id.toString()),
];

const nameInput: CheckInput<MemberObject, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}
		try {
			const reg = new RegExp(input, 'i');
			return (
				!!reg.exec(mem.nameFirst) ||
				!!reg.exec(mem.nameFirst) ||
				!!reg.exec(mem.nameMiddle) ||
				!!reg.exec(mem.nameSuffix)
			);
		} catch (e) {
			return true;
		}
	},
	displayText: 'Name:',
	filterInput: TextInput,
};

const rankGreaterThan: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (memberRanks.indexOf(normalizeRankInput(input)) === -1) {
			return true;
		}

		if (mem.type === 'CAPNHQMember' || mem.type === 'CAPProspectiveMember') {
			return (
				memberRanks.indexOf(normalizeRankInput(mem.memberRank)) >=
				memberRanks.indexOf(normalizeRankInput(input))
			);
		} else {
			return false;
		}
	},
	displayText: 'Rank greater than:',
	filterInput: TextInput,
};

const rankLessThan: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (memberRanks.indexOf(normalizeRankInput(input)) === -1) {
			return true;
		}

		if (mem.type === 'CAPNHQMember' || mem.type === 'CAPProspectiveMember') {
			return (
				memberRanks.indexOf(normalizeRankInput(mem.memberRank)) <=
				memberRanks.indexOf(normalizeRankInput(input))
			);
		} else {
			return false;
		}
	},
	displayText: 'Rank less than:',
	filterInput: TextInput,
};

const flightInput: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (mem.flight === null || mem.flight === undefined) {
			return false;
		}

		try {
			if (
				(mem.type === 'CAPProspectiveMember' || mem.type === 'CAPNHQMember') &&
				mem.flight !== null
			) {
				return !!new RegExp(input, 'i').exec(mem.flight);
			} else {
				return false;
			}
		} catch (e) {
			return true;
		}
	},
	displayText: 'Flight:',
	filterInput: TextInput,
};

const advancedFiltersWithFlight = [nameInput, rankGreaterThan, rankLessThan, flightInput] as const;
const advancedFilters = [nameInput, rankGreaterThan, rankLessThan] as const;

const simpleFiltersWithFlight = [nameInput, flightInput] as const;
const simpleFilters = [nameInput] as const;

interface SelectorFormValues {
	members: Member[];
	sortFunction: SortFunction;
	displayAdvanced: boolean;
}

export default class FlightContact extends Page<PageProps, EmailListState> {
	public state: EmailListState = {
		state: 'LOADING',
		displayAdvanced: false,
		filterValues: {
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: '',
			flightInput: pipe(
				M.filterType(isCAPMember),
				M.filterType(isFlightStaff),
				M.map(get('flight')),
				M.flatMap(M.fromValue),
				M.orSome(''),
			)(M.fromValue(this.props.member)),
		},
		selectedMembers: [],
		sortFunction: SortFunction.CAPID,
		visibleItems: [],
	};

	private selectableDiv = React.createRef<HTMLDivElement>();

	public constructor(props: PageProps) {
		super(props);

		this.selectText = this.selectText.bind(this);
		this.selectAllVisible = this.selectAllVisible.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/flightcontact',
				text: 'Flight contact',
			},
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Email selector');

		if (
			this.props.member &&
			isCAPMember(this.props.member) &&
			hasAllowedDutyPosition(this.props.member)
		) {
			const memberEither = await fetchApi.member.flight.membersFull({}, {});

			if (Either.isLeft(memberEither)) {
				this.setState(prev => ({
					...prev,
					state: 'ERROR',
					message: memberEither.value.message,
				}));
			} else {
				this.setState(prev => ({
					...prev,
					state: 'LOADED',
					members: memberEither.value.filter(Either.isRight).map(get('value')),
				}));
			}
		}
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (!(isCAPMember(this.props.member) && hasAllowedDutyPosition(this.props.member))) {
			return <div>You do not have permission to do that</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		const currentSortFunction = sortFunctions[this.state.sortFunction];

		const filterValues = this.state.filterValues;

		const getSelector = (state: EmailListLoadedState & EmailListUIState): JSX.Element => {
			const selectorProps: Omit<
				SelectorPropsMultiple<Member, any[]>,
				'filters' | 'onFilterValuesChange' | 'filterValues'
			> = {
				fullWidth: true,
				name: 'members',
				values: state.members.slice(0).sort(currentSortFunction),
				multiple: true,
				showIDField: state.displayAdvanced,
				onChangeVisible: newVisibleItems =>
					this.setState({
						visibleItems: newVisibleItems,
					}),
				overflow: 750,
				displayValue: getFullMemberName,
			};

			const showFlightFilter =
				this.props.member &&
				isCAPMember(this.props.member) &&
				hasOneDutyPosition([
					'Cadet Commander',
					'Cadet Deputy Commander',
					'Cadet Executive Officer',
					'Deputy Commander for Cadets',
				])(this.props.member);

			return state.displayAdvanced && showFlightFilter ? (
				<Selector<
					Member,
					[
						nameInput: string,
						rankGreaterThan: string,
						rankLessThan: string,
						flight: string,
					]
				>
					{...selectorProps}
					filters={advancedFiltersWithFlight}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
								rankGreaterThan: values[1],
								rankLessThan: values[2],
								flightInput: values[3],
							},
						}))
					}
					filterValues={[
						filterValues.nameInput,
						filterValues.rankGreaterThan,
						filterValues.rankLessThan,
						filterValues.flightInput,
					]}
				/>
			) : state.displayAdvanced ? (
				<Selector<
					Member,
					[nameInput: string, rankGreaterThan: string, rankLessThan: string]
				>
					{...selectorProps}
					filters={advancedFilters}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
								rankGreaterThan: values[1],
								rankLessThan: values[2],
							},
						}))
					}
					filterValues={[
						filterValues.nameInput,
						filterValues.rankGreaterThan,
						filterValues.rankLessThan,
					]}
				/>
			) : showFlightFilter ? (
				<Selector<Member, [nameInput: string, flight: string]>
					{...selectorProps}
					filters={simpleFiltersWithFlight}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
								flightInput: values[1],
							},
						}))
					}
					filterValues={[filterValues.nameInput, filterValues.flightInput]}
				/>
			) : (
				<Selector<Member, [nameInput: string]>
					{...selectorProps}
					filters={simpleFilters}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
							},
						}))
					}
					filterValues={[filterValues.nameInput]}
				/>
			);
		};

		return (
			<>
				<Button
					onClick={() => {
						this.setState(prev =>
							prev.state === 'LOADED'
								? {
										...prev,
										selectedMembers: prev.members.slice(0),
								  }
								: prev,
						);
					}}
				>
					Select all
				</Button>
				&nbsp; &nbsp; &nbsp;
				<Button onClick={this.selectAllVisible}>Select all visible</Button>
				&nbsp; &nbsp; &nbsp;
				<Button
					onClick={() => {
						this.setState({
							selectedMembers: [],
						});
					}}
				>
					Deselect all
				</Button>
				<br />
				<br />
				{this.state.displayAdvanced ? (
					<div>
						Available ranks include: <br />
						C/Amn, C/A1C, C/SrA, C/SSgt, C/MSgt, C/SMSgt, C/CMSgt, C/2dLt, C/1stLt,
						C/Capt, C/Maj, C/LtCol, C/Col, 2dLt, 1stLt, Capt, Maj, LtCol, Col, BrigGen,
						MajGen, LtGen, Gen
					</div>
				) : null}
				<br />
				<br />
				<SimpleForm<SelectorFormValues>
					showSubmitButton={false}
					values={{
						members: this.state.selectedMembers,
						sortFunction: this.state.sortFunction,
						displayAdvanced: this.state.displayAdvanced,
					}}
					onChange={({ members, sortFunction, displayAdvanced }) => {
						this.setState({
							selectedMembers: members,
							sortFunction,
							displayAdvanced,
						});
					}}
				>
					<Label>Select how to sort</Label>
					<SimpleRadioButton<SortFunction>
						name="sortFunction"
						labels={['Last name', 'First name', 'CAPID']}
					/>

					<Label>Show advanced filters</Label>
					<Checkbox name="displayAdvanced" />

					{getSelector(this.state)}
				</SimpleForm>
				<div>
					{this.state.selectedMembers.length} member
					{this.state.selectedMembers.length === 1 ? '' : 's'} selected
				</div>
				<h2>Emails:</h2>
				{this.state.selectedMembers.map(mem => this.getEmail(mem)).filter(email => !email)
					.length > 0 ? (
					<div className="warning">
						Warning: Some selected members do not have an email stored
					</div>
				) : null}
				<div
					style={{
						height: 400,
						width: '98%',
						overflow: 'auto',
						border: '1px solid black',
						boxSizing: 'border-box',
						padding: 5,
						margin: 0,
						fontStyle: 'italic',
					}}
					onClick={this.selectText}
					ref={this.selectableDiv}
				>
					{this.getEmails()}
				</div>
				<h2>Phone numbers:</h2>
				<div
					style={{
						height: 400,
						width: '98%',
						overflow: 'auto',
						border: '1px solid black',
						boxSizing: 'border-box',
						margin: 0,
					}}
				>
					{this.getPhoneNumbers()}
				</div>
			</>
		);
	}

	private getEmail = (member: Member): string | undefined =>
		Maybe.orSome<string | undefined>(undefined)(getMemberEmail(member.contact));

	private selectText = (): void => {
		if (this.selectableDiv.current) {
			try {
				const range = document.createRange();
				range.selectNode(this.selectableDiv.current);
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}
			} catch (e) {
				// Probably an old browser
				// (Looking at you, IE)
				return;
			}
		}
	};

	private getPhoneNumbers = (): JSX.Element[] =>
		this.state.selectedMembers
			.map(this.renderMember)
			.filter(item => item.phoneCount > 0)
			.map(item => item.element);

	private getEmails(): string {
		const emails: { [key: string]: true } = {};

		(this.state.selectedMembers
			.map(this.getEmail)
			.filter(email => !!email) as string[]).forEach(email => (emails[email] = true));

		return Object.keys(emails).join('; ');
	}

	private renderMember = (
		member: Member,
		index: number,
	): { phoneCount: number; element: JSX.Element } => {
		const phoneCount = [
			member.contact.CELLPHONE.PRIMARY,
			member.contact.CELLPHONE.SECONDARY,
			member.contact.CELLPHONE.EMERGENCY,
			member.contact.HOMEPHONE.PRIMARY,
			member.contact.HOMEPHONE.SECONDARY,
			member.contact.HOMEPHONE.EMERGENCY,
			member.contact.WORKPHONE.PRIMARY,
			member.contact.WORKPHONE.SECONDARY,
			member.contact.WORKPHONE.EMERGENCY,
		].filter(item => item !== '').length;

		const absent =
			member.absenteeInformation && member.absenteeInformation.absentUntil > Date.now() ? (
				<span className="flightcontactlist-absent">
					Absent until{' '}
					{DateTime.fromMillis(member.absenteeInformation.absentUntil).toLocaleString()}
				</span>
			) : null;

		return {
			phoneCount,
			element: (
				<div className="flightcontactlist-item" key={index}>
					<div className="flightcontactlist-name">
						{getFullMemberName(member)}
						<br />
						{absent}
					</div>
					<div className="flightcontactlist-phones">
						{member.contact.CADETPARENTPHONE.PRIMARY !== undefined ? (
							<p>
								{member.contact.CADETPARENTPHONE.PRIMARY} (Primary Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CADETPARENTPHONE.SECONDARY !== undefined ? (
							<p>
								{member.contact.CADETPARENTPHONE.SECONDARY} (Secondary Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CADETPARENTPHONE.EMERGENCY !== undefined ? (
							<p>
								{member.contact.CADETPARENTPHONE.EMERGENCY} (Emergency Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CELLPHONE.PRIMARY !== undefined ? (
							<p>{member.contact.CELLPHONE.PRIMARY} (Primary Cell Phone)</p>
						) : null}
						{member.contact.CELLPHONE.SECONDARY !== undefined ? (
							<p>{member.contact.CELLPHONE.SECONDARY} (Secondary Cell Phone)</p>
						) : null}
						{member.contact.CELLPHONE.EMERGENCY !== undefined ? (
							<p>{member.contact.CELLPHONE.EMERGENCY} (Emergency Cell Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.PRIMARY !== undefined ? (
							<p>{member.contact.HOMEPHONE.PRIMARY} (Primary Home Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.SECONDARY !== undefined ? (
							<p>{member.contact.HOMEPHONE.SECONDARY} (Secondary Home Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.EMERGENCY !== undefined ? (
							<p>{member.contact.HOMEPHONE.EMERGENCY} (Emergency Home Phone)</p>
						) : null}
						{member.contact.WORKPHONE.PRIMARY !== undefined ? (
							<p>{member.contact.WORKPHONE.PRIMARY} (Primary Work Phone)</p>
						) : null}
						{member.contact.WORKPHONE.SECONDARY !== undefined ? (
							<p>{member.contact.WORKPHONE.SECONDARY} (Secondary Work Phone)</p>
						) : null}
						{member.contact.WORKPHONE.EMERGENCY !== undefined ? (
							<p>{member.contact.WORKPHONE.EMERGENCY} (Emergency Work Phone)</p>
						) : null}
					</div>
				</div>
			),
		};
	};

	private selectAllVisible = (): void => {
		this.setState(prev => {
			const selectedMembers: Member[] = prev.selectedMembers.slice(0);

			prev.visibleItems.forEach(item => {
				if (selectedMembers.filter(areMembersTheSame(item)).length < 1) {
					selectedMembers.push(item);
				}
			});

			return { selectedMembers };
		});
	};
}
