import { AttendanceStatus, Member, MemberObject } from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import Button from '../../components/Button';
import { InputProps } from '../../components/form-inputs/Input';
import Selector, { CheckInput } from '../../components/form-inputs/Selector';
import SimpleRadioButton from '../../components/form-inputs/SimpleRadioButton';
import { TextInput } from '../../components/forms/SimpleForm';
import SimpleForm, { Checkbox, Label } from '../../components/forms/SimpleForm';
import Loader from '../../components/Loader';
import Event from '../../lib/Event';
import { CAPMemberClasses } from '../../lib/Members';
import Page, { PageProps } from '../Page';

enum SortFunction {
	LASTNAME,
	FIRSTNAME,
	CAPID
}

enum MemberList {
	CADET,
	SENIOR,
	ALL
}

interface SelectorFormValues {
	members: CAPMemberClasses[];
	sortFunction: SortFunction;
	displayAdvanced: boolean;
}

interface MultiAddState {
	members: CAPMemberClasses[] | null;
	event: Event | null;
	error: number;
	selectedMembers: CAPMemberClasses[];
	sortFunction: SortFunction;
	visibleItems: CAPMemberClasses[];
	displayAdvanced: boolean;
	filterValues: {
		flightInput: string;
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		memberFilter: MemberList;
	};
}

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
	'gen'
];

const normalizeRankInput = (rank: string) =>
	(rank || '')
		.toLowerCase()
		.replace('/', '')
		.replace('2nd', '2d')
		.replace(' ', '');

const sortFunctions: Array<(a: Member, b: Member) => number> = [
	(a, b) => a.nameLast.localeCompare(b.nameLast),
	(a, b) => a.nameFirst.localeCompare(b.nameFirst),
	(a, b) => a.id.toString().localeCompare(b.id.toString())
];

const grayedOut: React.CSSProperties = {
	color: 'gray',
	cursor: 'default',
	fontStyle: 'italic'
};

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
	filterInput: TextInput
};

const nameInput: CheckInput<MemberObject, string> = {
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
	filterInput: TextInput
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
	filterInput: TextInput
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
	filterInput: TextInput
};

const memberFilter: CheckInput<Member, MemberList> = {
	check: (mem, input) => {
		return memberFilters[typeof input === 'undefined' || input === -1 ? MemberList.ALL : input](
			mem
		);
	},
	filterInput: (props: InputProps<MemberList>) => (
		<SimpleRadioButton
			labels={['Cadets', 'Senior Members', 'All']}
			name=""
			value={typeof props.value === 'undefined' ? MemberList.ALL : props.value}
			onChange={props.onChange}
			onInitialize={props.onInitialize}
			onUpdate={props.onUpdate}
		/>
	),
	displayText: 'Member type'
};

const memberFilters: Array<(a: Member) => boolean> = [
	a => (a.type === 'CAPNHQMember' || a.type === 'CAPProspectiveMember' ? !a.seniorMember : false),
	a => (a.type === 'CAPNHQMember' || a.type === 'CAPProspectiveMember' ? a.seniorMember : true),
	() => true
];

const advancedFilters = [flightInput, nameInput, rankGreaterThan, rankLessThan, memberFilter];

const simpleFilters = [nameInput, memberFilter];

export default class AttendanceMultiAdd extends Page<PageProps<{ id: string }>, MultiAddState> {
	public state: MultiAddState = {
		members: null,
		event: null,
		error: 0,
		displayAdvanced: false,
		filterValues: {
			flightInput: '',
			memberFilter: MemberList.ALL,
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: ''
		},
		selectedMembers: [],
		sortFunction: SortFunction.LASTNAME,
		visibleItems: []
	};

	constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.renderMember = this.renderMember.bind(this);

		this.selectAll = this.selectAll.bind(this);
		this.selectVisible = this.selectVisible.bind(this);
		this.deselectAll = this.deselectAll.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.addMembers = this.addMembers.bind(this);
		this.handleDifferentVisibleItems = this.handleDifferentVisibleItems.bind(this);
		this.addMembers = this.addMembers.bind(this);
		this.onFilterValuesChange = this.onFilterValuesChange.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		const eventID = parseInt(this.props.routeProps.match.params.id.split('-')[0], 10);

		// eslint-disable-next-line
		if (eventID !== eventID) {
			return this.setState({
				error: 404
			});
		}

		let members;
		let event;

		try {
			[members, event] = await Promise.all([
				this.props.account.getMembers(this.props.member),
				Event.Get(eventID, this.props.member, this.props.account)
			]);

			this.setState({
				members,
				event
			});
		} catch (e) {
			this.setState({
				error: 404
			});
			return;
		}

		if (!event.isPOC(this.props.member)) {
			this.setState({
				error: 403
			});
			return;
		}

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: `/eventviewer/${event.id}`,
				text: `View "${event.name}"`
			},
			{
				target: `/multiadd/${event.id}`,
				text: 'Attendance add'
			}
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Attendance add');
	}

	public render() {
		if (this.state.error === 403 || !this.props.member) {
			return <div>You do not have permission to do that</div>;
		}
		if (this.state.error === 404) {
			return <div>The requested event does not exist</div>;
		}

		if (this.state.event === null) {
			return <Loader />;
		}

		const MemberSelector = (Selector as unknown) as new () => Selector<CAPMemberClasses>;

		const SelectorForm = SimpleForm as new () => SimpleForm<SelectorFormValues>;

		const SortSelector = SimpleRadioButton as new () => SimpleRadioButton<SortFunction>;

		const currentSortFunction = sortFunctions[this.state.sortFunction];

		const filterValues = this.state.displayAdvanced
			? [
					this.state.filterValues.flightInput,
					this.state.filterValues.nameInput,
					this.state.filterValues.rankGreaterThan,
					this.state.filterValues.rankLessThan,
					this.state.filterValues.memberFilter
			  ]
			: [this.state.filterValues.nameInput, this.state.filterValues.memberFilter];

		return (
			<>
				<Button onClick={this.selectAll}>Select all</Button>
				&nbsp; &nbsp; &nbsp;
				<Button onClick={this.selectVisible}>Select visible</Button>
				&nbsp; &nbsp; &nbsp;
				<Button onClick={this.deselectAll}>Deselect all</Button>
				<br />
				<br />
				<SelectorForm
					values={{
						members: this.state.selectedMembers,
						sortFunction: this.state.sortFunction,
						displayAdvanced: this.state.displayAdvanced
					}}
					onChange={this.handleChange}
					onSubmit={this.addMembers}
				>
					<Label>Select how to sort</Label>
					<SortSelector
						name="sortFunction"
						labels={['Last name', 'First name', 'CAPID']}
					/>

					<Label>Show advanced filters</Label>
					<Checkbox name="displayAdvanced" />

					<MemberSelector
						name="members"
						values={this.state.members!.slice(0).sort(currentSortFunction)}
						displayValue={this.renderMember}
						multiple={true}
						showIDField={this.state.displayAdvanced}
						onChangeVisible={this.handleDifferentVisibleItems}
						overflow={750}
						filters={this.state.displayAdvanced ? advancedFilters : simpleFilters}
						filterValues={filterValues}
						onFilterValuesChange={this.onFilterValuesChange}
					/>
				</SelectorForm>
			</>
		);
	}

	private renderMember(member: CAPMemberClasses) {
		if (!this.state.event) {
			return <div>{member.getFullName()}</div>;
		}

		if (this.state.event.hasMember(member)) {
			return (
				<div title="This member is already in attendance" style={grayedOut}>
					{member.getFullName()}
				</div>
			);
		} else {
			return <div>{member.getFullName()}</div>;
		}
	}

	private filterMembers(members: CAPMemberClasses[]) {
		return members.filter(member => !this.state.event!.hasMember(member));
	}

	private selectAll() {
		this.setState(prev => ({
			selectedMembers: this.filterMembers((prev.members || []).slice(0))
		}));
	}

	private selectVisible() {
		this.setState(prev => ({
			selectedMembers: this.filterMembers(prev.visibleItems)
		}));
	}

	private deselectAll() {
		this.setState({
			selectedMembers: []
		});
	}

	private handleChange({ members, sortFunction, displayAdvanced }: SelectorFormValues) {
		this.setState({
			selectedMembers: this.filterMembers(members),
			sortFunction,
			displayAdvanced
		});
	}

	private async addMembers({ members, sortFunction, displayAdvanced }: SelectorFormValues) {
		await this.state.event!.addAttendees(
			this.props.member!,
			members.map(member => ({
				arrivalTime: null,
				departureTime: null,
				canUsePhotos: true,
				comments: `Multi add by ${this.props.member!.getFullName()} on ${DateTime.local().toLocaleString()}`,
				memberID: member.getReference(),
				planToUseCAPTransportation: false,
				status: AttendanceStatus.COMMITTEDATTENDED
			})),
			members
		);

		this.setState({
			selectedMembers: []
		});
	}

	private handleDifferentVisibleItems(visibleItems: CAPMemberClasses[]) {
		this.setState({
			visibleItems
		});
	}

	private onFilterValuesChange(values: any) {
		if (!this.state.displayAdvanced) {
			this.setState(prev => ({
				filterValues: {
					...prev.filterValues,
					nameInput: values[0],
					memberFilter: values[1]
				}
			}));
		} else {
			this.setState({
				filterValues: {
					flightInput: values[0],
					nameInput: values[1],
					rankGreaterThan: values[2],
					rankLessThan: values[3],
					memberFilter: values[4]
				}
			});
		}
	}
}
