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
	AsyncEither,
	AttendanceRecord,
	AttendanceStatus,
	complement,
	effectiveManageEventPermissionForEvent,
	Either,
	EventObject,
	formatEventViewerDate,
	get,
	getFullMemberName,
	hasMember,
	Maybe,
	Member,
	MemberObject,
	Permissions,
	toReference,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import Button from '../../components/Button';
import { InputProps } from '../../components/form-inputs/Input';
import Selector, { CheckInput, SelectorPropsMultiple } from '../../components/form-inputs/Selector';
import SimpleRadioButton from '../../components/form-inputs/SimpleRadioButton';
import SimpleForm, {
	Checkbox,
	Label,
	NumberInput,
	TextBox,
	TextInput,
} from '../../components/forms/SimpleForm';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

enum SortFunction {
	LASTNAME,
	FIRSTNAME,
	CAPID,
}

enum MemberList {
	CADET,
	SENIOR,
	ALL,
}

interface SelectorFormValues {
	members: Member[];
	sortFunction: SortFunction;
	displayAdvanced: boolean;
}

interface MultiAddMemberLoadingState {
	state: 'LOADING';
}

interface MultiAddMemberLoadedState {
	state: 'LOADED';

	members: Member[];
	event: EventObject;
}

interface MultiAddMemberErrorState {
	state: 'ERROR';

	message: string;
}

interface MultiAddUIState {
	selectedMembers: Member[];
	sortFunction: SortFunction;
	visibleItems: Member[];
	displayAdvanced: boolean;
	filterValues: {
		flightInput: string;
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		memberFilter: MemberList;
	};
	capidAdd: number | null;
	capidSaved: boolean;
	capidSaving: boolean;
	capidError: string | null;
}

type MultiAddState = MultiAddUIState &
	(MultiAddMemberLoadedState | MultiAddMemberLoadingState | MultiAddMemberErrorState);

const memberRanks = [
	'cab',
	'camn',
	'ca1c',
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

const normalizeRankInput = (rank: string): string =>
	(rank || '').toLowerCase().replace('/', '').replace('2nd', '2d').replace(' ', '');

const sortFunctions: Array<(a: Member, b: Member) => number> = [
	(a, b) => a.nameLast.localeCompare(b.nameLast),
	(a, b) => a.nameFirst.localeCompare(b.nameFirst),
	(a, b) => a.id.toString().localeCompare(b.id.toString()),
];

const grayedOut: React.CSSProperties = {
	color: 'gray',
	cursor: 'default',
	fontStyle: 'italic',
};

const flightInput: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (!!/senior/i.exec(input)) {
			if (mem.type === 'CAPNHQMember' || mem.type === 'CAPProspectiveMember') {
				return mem.seniorMember;
			}
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

const memberFilter: CheckInput<Member, MemberList> = {
	check: (mem, input) => memberFilters[Maybe.orSome(MemberList.ALL)(Maybe.fromValue(input))](mem),
	filterInput: (props: InputProps<MemberList>) => (
		<SimpleRadioButton<MemberList>
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

const advancedFilters = [
	flightInput,
	nameInput,
	rankGreaterThan,
	rankLessThan,
	memberFilter,
] as const;

const simpleFilters = [nameInput, memberFilter] as const;

export default class AttendanceMultiAdd extends Page<PageProps<{ id: string }>, MultiAddState> {
	public state: MultiAddState = {
		state: 'LOADING',
		displayAdvanced: false,
		filterValues: {
			flightInput: '',
			memberFilter: MemberList.ALL,
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: '',
		},
		selectedMembers: [],
		sortFunction: SortFunction.LASTNAME,
		visibleItems: [],
		capidAdd: null,
		capidSaved: false,
		capidSaving: false,
		capidError: null,
	};

	public async componentDidMount(): Promise<void> {
		this.updateTitle('Attendance add');

		if (!this.props.member) {
			return;
		}

		const eventID = parseInt(this.props.routeProps.match.params.id.split('-')[0], 10);

		// eslint-disable-next-line
		if (eventID !== eventID) {
			return this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: 'Could not find event specified',
			}));
		}

		const resultsEither = await AsyncEither.All([
			fetchApi.member.memberList({}, {}),
			fetchApi.events.events.get({ id: eventID.toString() }, {}),
		]);

		if (Either.isLeft(resultsEither)) {
			return this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: resultsEither.value.message,
			}));
		}

		const [members, event] = resultsEither.value;

		// this.updateURL(`/multiadd/${event.getEventURLComponent()}`);

		if (
			effectiveManageEventPermissionForEvent(this.props.member)(event) ===
			Permissions.ManageEvent.NONE
		) {
			return this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: 'You do not have permission to do that',
			}));
		}

		this.setState(prev => ({
			...prev,

			state: 'LOADED',
			members,
			event,
		}));

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: `/eventviewer/${event.id}`,
				text: `View "${event.name}"`,
			},
			{
				target: `/multiadd/${event.id}`,
				text: 'Attendance add',
			},
		]);

		this.props.updateSideNav([]);
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <SigninLink>Please sign in to continue.</SigninLink>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		const currentSortFunction = sortFunctions[this.state.sortFunction];

		const getSelector = (state: MultiAddUIState & MultiAddMemberLoadedState): JSX.Element => {
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
				displayValue: this.renderMember,
			};

			return !state.displayAdvanced ? (
				<Selector<Member, [string, MemberList]>
					{...selectorProps}
					filters={simpleFilters}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
								memberFilter: values[1],
							},
						}))
					}
					filterValues={[state.filterValues.nameInput, state.filterValues.memberFilter]}
				/>
			) : (
				<Selector<Member, [string, string, string, string, MemberList]>
					{...selectorProps}
					filters={advancedFilters}
					onFilterValuesChange={values =>
						this.setState(prev => ({
							filterValues: {
								...prev.filterValues,
								nameInput: values[0],
								flightInput: values[1],
								rankGreaterThan: values[2],
								rankLessThan: values[3],
								memberFilter: values[4],
							},
						}))
					}
					filterValues={[
						state.filterValues.nameInput,
						state.filterValues.flightInput,
						state.filterValues.rankGreaterThan,
						state.filterValues.rankLessThan,
						state.filterValues.memberFilter,
					]}
				/>
			);
		};

		return (
			<>
				<SimpleForm<{ capid: number | null }>
					values={{ capid: this.state.capidAdd }}
					validator={{ capid: id => id !== null && id >= 100000 && id <= 999999 }}
					onChange={this.modifyCAPID}
					onSubmit={this.addCAPID}
					submitInfo={{
						text: this.state.capidSaving ? 'Adding...' : 'Add',
						disabled: this.state.capidSaving,
					}}
					disableOnInvalid={true}
				>
					<TextBox>
						<b>
							<span style={{ color: 'red' }}>{this.state.capidError}</span>
						</b>
					</TextBox>

					<Label>Add by CAP ID</Label>
					<NumberInput name="capid" errorMessage="Invalid CAP ID" />
				</SimpleForm>
				<Button onClick={this.selectAll}>Select all</Button>
				&nbsp; &nbsp; &nbsp;
				<Button onClick={this.selectVisible}>Select visible</Button>
				&nbsp; &nbsp; &nbsp;
				<Button onClick={this.deselectAll}>Deselect all</Button>
				<br />
				<br />
				<SimpleForm<SelectorFormValues>
					values={{
						members: this.state.selectedMembers,
						sortFunction: this.state.sortFunction,
						displayAdvanced: this.state.displayAdvanced,
					}}
					onChange={this.handleChange}
					onSubmit={this.addMembers}
					submitInfo={{
						text: this.state.capidSaving ? 'Adding...' : 'Add',
						disabled: this.state.capidSaving,
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
			</>
		);
	}

	private renderMember = (member: Member): JSX.Element => {
		if (this.state.state !== 'LOADED') {
			return <div>{getFullMemberName(member)}</div>;
		}

		return hasMember(this.state.event)(member) ? (
			<div title="This member is already in attendance" style={grayedOut}>
				{getFullMemberName(member)}
			</div>
		) : (
			<div>{getFullMemberName(member)}</div>
		);
	};

	private filterMembers(members: Member[]): Member[] {
		if (this.state.state !== 'LOADED') {
			return [];
		}

		return members.filter(complement(hasMember(this.state.event)));
	}

	private selectAll = (): void => {
		this.setState(prev =>
			prev.state === 'LOADED'
				? {
						...prev,
						selectedMembers: this.filterMembers((prev.members || []).slice(0)),
				  }
				: prev,
		);
	};

	private selectVisible = (): void => {
		this.setState(prev => ({
			selectedMembers: this.filterMembers(prev.visibleItems),
		}));
	};

	private deselectAll = (): void => {
		this.setState({
			selectedMembers: [],
		});
	};

	private handleChange = ({
		members,
		sortFunction,
		displayAdvanced,
	}: SelectorFormValues): void => {
		this.setState({
			selectedMembers: this.filterMembers(members),
			sortFunction,
			displayAdvanced,
		});
	};

	private addMembers = async ({ members }: SelectorFormValues): Promise<void> => {
		if (!this.props.member) {
			return;
		}

		const member = this.props.member;

		const result = await fetchApi.events.attendance.addBulk(
			{ id: this.props.routeProps.match.params.id.split('-')[0] },
			{
				members: members.map(addedMember => ({
					shiftTime: null,
					canUsePhotos: true,
					comments: `Multi add by ${getFullMemberName(
						member,
					)} on ${DateTime.local().toLocaleString()}`,
					memberID: toReference(addedMember),
					planToUseCAPTransportation: false,
					status: AttendanceStatus.COMMITTEDATTENDED,
					customAttendanceFieldValues: [],
				})),
			},
		);

		if (Either.isRight(result)) {
			const attendance = result.value.filter(Either.isRight).map(get('value'));

			this.setState(prev =>
				prev.state === 'LOADED'
					? {
							...prev,
							event: {
								...prev.event,
								attendance,
							},
							selectedMembers: [],
					  }
					: prev,
			);
		} else {
			// TODO: Handle error case
		}
	};

	private modifyCAPID = ({ capid }: { capid: number | null }): void => {
		this.setState({
			capidAdd: capid,
			capidSaved: false,
			capidError: null,
		});
	};

	private addCAPID = async ({ capid }: { capid: number | null }): Promise<void> => {
		if (capid === null || this.state.state !== 'LOADED' || !this.props.member) {
			return;
		}

		this.setState({
			capidSaving: true,
			capidSaved: false,
			capidError: null,
		});

		if (hasMember(this.state.event)({ type: 'CAPNHQMember', id: capid })) {
			return this.setState({
				capidSaving: false,
				capidError: 'Member is already in attendance',
			});
		}

		const record: AttendanceRecord = {
			shiftTime: {
				arrivalTime: this.state.event.startDateTime,
				departureTime: this.state.event.pickupDateTime,
			},
			comments: `CAP ID add by ${getFullMemberName(
				this.props.member,
			)} on ${formatEventViewerDate(+new Date())}`,
			customAttendanceFieldValues: [],
			planToUseCAPTransportation: false,
			status: AttendanceStatus.COMMITTEDATTENDED,
			memberID: {
				type: 'CAPNHQMember' as const,
				id: capid,
			},

			sourceAccountID: this.props.account.id,
			sourceEventID: this.state.event.id,

			// Dummy fields the server ignores, the client doesn't need and we can't currently fully provide, but it satisfies the type checker
			memberName: '',
			summaryEmailSent: false,
			timestamp: Date.now(),
		};

		const result = await fetchApi.events.attendance.add(
			{ id: this.state.event.id.toString() },
			record,
		);

		if (Either.isLeft(result)) {
			this.setState({
				capidSaved: true,
				capidSaving: false,
				capidError: result.value.message,
			});
		} else {
			this.setState(prev =>
				prev.state === 'LOADED'
					? {
							...prev,
							capidSaved: true,
							capidSaving: false,
							event: {
								...prev.event,
								attendance: [...prev.event.attendance, record],
							},
					  }
					: {
							...prev,
							capidSaved: true,
							capidSaving: false,
					  },
			);
		}
	};
}
