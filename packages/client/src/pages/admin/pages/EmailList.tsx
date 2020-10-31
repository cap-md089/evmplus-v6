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

import { Member, Maybe, Either, areMembersTheSame, getFullMemberName } from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import { InputProps } from '../../../components/form-inputs/Input';
import { CheckInput } from '../../../components/form-inputs/Selector';
import SimpleForm, {
	Checkbox,
	Label,
	Selector,
	SimpleRadioButton,
	TextInput,
} from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import Page, { PageProps } from '../../Page';
import fetchApi from '../../../lib/apis';

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

const normalizeRankInput = (rank: string) =>
	(rank || '').toLowerCase().replace('/', '').replace('2nd', '2d').replace(' ', '');

interface EmailListLoadingState {
	state: 'LOADING';
}

interface EmailListLoadedState {
	state: 'LOADED';

	members: Member[];
}

interface EmailListErrorState {
	state: 'ERROR';

	error: string;
}

interface EmailListUIState {
	selectedMembers: Member[];
	sortFunction: SortFunction;
	visibleItems: Member[];
	displayAdvanced: boolean;
	addParentEmails: boolean;
	filterValues: {
		flightInput: string;
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		memberFilter: MemberList;
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

enum MemberList {
	CADET,
	SENIOR,
	ALL,
}

const flightInput: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (!!input.match(/senior/i)) {
			if (mem.type === 'CAPNHQMember' || mem.type === 'CAPProspectiveMember') {
				return mem.seniorMember;
			}
		}

		try {
			if (
				(mem.type === 'CAPProspectiveMember' || mem.type === 'CAPNHQMember') &&
				mem.flight !== null
			) {
				return !!mem.flight.match(new RegExp(input, 'i'));
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

const nameInput: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}
		try {
			const reg = new RegExp(input, 'i');
			return (
				!!mem.nameFirst.match(reg) ||
				!!mem.nameLast.match(reg) ||
				!!mem.nameMiddle.match(reg) ||
				!!mem.nameSuffix.match(reg)
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

const memberFilter: CheckInput<Member, MemberList> = {
	check: (mem, input) => {
		return memberFilters[Maybe.orSome(MemberList.ALL)(Maybe.fromValue(input))](mem);
	},
	filterInput: (props: InputProps<MemberList>) => (
		<SimpleRadioButton
			labels={['Cadets', 'Senior Members', 'All']}
			name=""
			value={Maybe.orSome(MemberList.ALL)(Maybe.fromValue(props.value))}
			onChange={props.onChange}
			onInitialize={props.onInitialize}
			onUpdate={props.onUpdate}
		/>
	),
	displayText: 'Member type',
};

const memberFilters: Array<(a: Member) => boolean> = [
	a => (a.type === 'CAPNHQMember' || a.type === 'CAPProspectiveMember' ? !a.seniorMember : false),
	a => (a.type === 'CAPNHQMember' || a.type === 'CAPProspectiveMember' ? a.seniorMember : true),
	() => true,
];

const advancedFilters = [flightInput, nameInput, rankGreaterThan, rankLessThan, memberFilter];

const simpleFilters = [nameInput, memberFilter];

export default class EmailList extends Page<PageProps, EmailListState> {
	public state: EmailListState = {
		state: 'LOADING',
		selectedMembers: [],
		sortFunction: SortFunction.LASTNAME,
		visibleItems: [],
		displayAdvanced: false,
		addParentEmails: true,
		filterValues: {
			flightInput: '',
			memberFilter: MemberList.ALL,
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: '',
		},
	};

	private selectableDiv = React.createRef<HTMLDivElement>();

	constructor(props: PageProps) {
		super(props);

		this.selectText = this.selectText.bind(this);
	}

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/emailselector',
				text: 'Email selector',
			},
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Email selector');

		if (this.props.member) {
			const membersEither = await fetchApi.member.memberList({}, {});

			if (Either.isLeft(membersEither)) {
				this.setState(prev => ({
					...prev,
					state: 'ERROR',
					error: membersEither.value.message,
				}));
			} else {
				this.setState(prev => ({
					...prev,
					state: 'LOADED',
					members: membersEither.value,
				}));
			}
		}
	}

	public render() {
		const MemberSelector = (Selector as unknown) as new () => Selector<Member>;

		const SelectorForm = SimpleForm as new () => SimpleForm<{
			members: Member[];
			sortFunction: SortFunction;
			displayAdvanced: boolean;
			addParentEmails: boolean;
		}>;

		const currentSortFunction = sortFunctions[this.state.sortFunction];

		const filterValues = this.state.filterValues;

		return this.props.member ? (
			this.state.state === 'LOADING' ? (
				<Loader />
			) : this.state.state === 'ERROR' ? (
				<div>{this.state.error}</div>
			) : (
				<>
					<Button
						onClick={() => {
							this.setState(prev =>
								prev.state === 'LOADED'
									? {
											...prev,
											selectedMembers: (prev.members || []).slice(0),
									  }
									: prev,
							);
						}}
					>
						Select all
					</Button>
					&nbsp; &nbsp; &nbsp;
					<Button
						onClick={() => {
							this.setState(prev => {
								if (prev.state !== 'LOADED') {
									return prev;
								}

								const selectedMembers = [
									...prev.selectedMembers,
									...prev.visibleItems.filter(
										item => !prev.selectedMembers.some(areMembersTheSame(item)),
									),
								];

								return { ...prev, selectedMembers };
							});
						}}
					>
						Select all visible
					</Button>
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
							C/Capt, C/Maj, C/LtCol, C/Col, 2dLt, 1stLt, Capt, Maj, LtCol, Col,
							BrigGen, MajGen, LtGen, Gen
						</div>
					) : null}
					<br />
					<br />
					<SelectorForm
						showSubmitButton={false}
						values={{
							members: this.state.selectedMembers,
							sortFunction: this.state.sortFunction,
							displayAdvanced: this.state.displayAdvanced,
							addParentEmails: this.state.addParentEmails,
						}}
						onChange={({ members, sortFunction, displayAdvanced, addParentEmails }) => {
							this.setState({
								selectedMembers: members,
								sortFunction,
								displayAdvanced,
								addParentEmails,
							});
						}}
						id="none"
					>
						<Label>Add parent emails</Label>
						<Checkbox name="addParentEmails" />

						<Label>Select how to sort</Label>
						<SimpleRadioButton<SortFunction>
							name="sortFunction"
							labels={['Last name', 'First name', 'CAPID']}
						/>
						<Label>Show advanced filters</Label>
						<Checkbox name="displayAdvanced" />
						<MemberSelector
							fullWidth={true}
							name="members"
							values={this.state.members.slice(0).sort(currentSortFunction)}
							displayValue={getFullMemberName}
							multiple={true}
							showIDField={this.state.displayAdvanced}
							onChangeVisible={newVisibleItems => {
								this.setState({
									visibleItems: newVisibleItems,
								});
							}}
							overflow={750}
							filters={this.state.displayAdvanced ? advancedFilters : simpleFilters}
							onFilterValuesChange={values => {
								if (!this.state.displayAdvanced) {
									this.setState(prev => ({
										filterValues: {
											...prev.filterValues,
											nameInput: values[0],
											memberFilter: values[1],
										},
									}));
								} else {
									this.setState({
										filterValues: {
											flightInput: values[0],
											nameInput: values[1],
											rankGreaterThan: values[2],
											rankLessThan: values[3],
											memberFilter: values[4],
										},
									});
								}
							}}
							filterValues={
								this.state.displayAdvanced
									? [
											filterValues.flightInput,
											filterValues.nameInput,
											filterValues.rankGreaterThan,
											filterValues.rankLessThan,
											filterValues.memberFilter,
									  ]
									: [filterValues.nameInput, filterValues.memberFilter]
							}
						/>
					</SelectorForm>
					<h2>Emails:</h2>
					{this.state.selectedMembers
						.map(mem => this.getEmail(mem))
						.filter(email => !email).length > 0 ? (
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
						{this.getEmailText()}
					</div>
				</>
			)
		) : (
			<div>Please sign in</div>
		);
	}

	private getEmailText() {
		const emails: { [key: string]: true } = {};

		this.state.selectedMembers
			.flatMap(this.getEmail.bind(this))
			.filter(email => !!email)
			.forEach(email => (emails[email] = true));

		return Object.keys(emails).join('; ');
	}

	private getEmail(member: Member): string[] {
		return (this.state.addParentEmails
			? [
					member.contact.EMAIL.PRIMARY,
					member.contact.CADETPARENTEMAIL.PRIMARY,
					member.contact.EMAIL.SECONDARY,
					member.contact.CADETPARENTEMAIL.SECONDARY,
					member.contact.EMAIL.EMERGENCY,
					member.contact.CADETPARENTEMAIL.EMERGENCY,
			  ]
			: [
					member.contact.EMAIL.PRIMARY ||
						member.contact.CADETPARENTEMAIL.PRIMARY ||
						member.contact.EMAIL.SECONDARY ||
						member.contact.CADETPARENTEMAIL.SECONDARY ||
						member.contact.EMAIL.EMERGENCY ||
						member.contact.CADETPARENTEMAIL.EMERGENCY,
			  ]
		).filter((s): s is string => !!s);
	}

	private selectText() {
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
	}
}
