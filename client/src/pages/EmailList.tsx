import * as React from 'react';
import Button from '../components/Button';
import { CheckInput } from '../components/form-inputs/Selector';
import { SimpleRadioProps } from '../components/form-inputs/SimpleRadioButton';
import Loader from '../components/Loader';
import SimpleForm, {
	Checkbox,
	Label,
	RadioButton,
	Selector,
	SimpleRadioButton,
	TextInput
} from '../components/forms/SimpleForm';
import Page, { PageProps } from './Page';
import { MemberClasses } from 'src/lib/Members';

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
	'gen'
];

const normalizeRankInput = (rank: string) =>
	(rank || '')
		.toLowerCase()
		.replace('/', '')
		.replace('2nd', '2d')
		.replace(' ', '');

interface EmailListState {
	selectedMembers: MemberClasses[];
	availableMembers: null | (MemberClasses[]);
	sortFunction: RadioReturn<SortFunction>;
	visibleItems: MemberClasses[];
	displayAdvanced: boolean;
	filterValues: {
		flightInput: string;
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		memberFilter: MemberList;
	};
}

enum SortFunction {
	LASTNAME,
	FIRSTNAME,
	CAPID
}

const sortFunctions: Array<(a: Member, b: Member) => number> = [
	(a, b) => a.nameLast.localeCompare(b.nameLast),
	(a, b) => a.nameFirst.localeCompare(b.nameFirst),
	(a, b) => a.id.toString().localeCompare(b.id.toString())
];

enum MemberList {
	CADET,
	SENIOR,
	ALL
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
			if (mem.type === 'CAPProspectiveMember' || mem.type === 'CAPNHQMember') {
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
	filterInput: (props: SimpleRadioProps<MemberList>) => (
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

export default class EmailList extends Page<PageProps, EmailListState> {
	public state: EmailListState = {
		selectedMembers: [],
		availableMembers: null,
		sortFunction: [SortFunction.LASTNAME, ''],
		visibleItems: [],
		displayAdvanced: false,
		filterValues: {
			flightInput: '',
			memberFilter: MemberList.ALL,
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: ''
		}
	};

	private selectableDiv = React.createRef<HTMLDivElement>();

	constructor(props: PageProps) {
		super(props);

		this.selectText = this.selectText.bind(this);
	}

	public async componentDidMount() {
		if (this.props.member) {
			const members = await this.props.account.getMembers(this.props.member);

			this.setState({
				availableMembers: members
			});
		}

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/emailselector',
				text: 'Email selector'
			}
		]);

		this.props.updateSideNav([]);

		this.updateTitle('Email selector');
	}

	public render() {
		const MemberSelector = (Selector as unknown) as new () => Selector<MemberClasses>;

		const SelectorForm = SimpleForm as new () => SimpleForm<{
			members: MemberClasses[];
			sortFunction: RadioReturn<SortFunction>;
			displayAdvanced: boolean;
		}>;

		const SortSelector = RadioButton as new () => RadioButton<SortFunction>;

		const currentSortFunction = sortFunctions[this.state.sortFunction[0]];

		const filterValues = this.state.filterValues;

		return this.props.member ? (
			this.state.availableMembers === null ? (
				<Loader />
			) : (
				<>
					<Button
						onClick={() => {
							this.setState(prev => ({
								selectedMembers: (prev.availableMembers || []).slice(0)
							}));
						}}
					>
						Select all
					</Button>
					&nbsp; &nbsp; &nbsp;
					<Button
						onClick={() => {
							this.setState(prev => {
								const selectedMembers: MemberClasses[] = prev.selectedMembers.slice(
									0
								);

								prev.visibleItems.forEach(item => {
									if (
										selectedMembers.filter(i =>
											i.matchesReference(item.getReference())
										).length === 0
									) {
										selectedMembers.push(item);
									}
								});

								return { selectedMembers };
							});
						}}
					>
						Select all visible
					</Button>
					&nbsp; &nbsp; &nbsp;
					<Button
						onClick={() => {
							this.setState({
								selectedMembers: []
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
							displayAdvanced: this.state.displayAdvanced
						}}
						onChange={({ members, sortFunction, displayAdvanced }) => {
							this.setState({
								selectedMembers: members,
								sortFunction,
								displayAdvanced
							});
						}}
						id="none"
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
							values={this.state.availableMembers.slice(0).sort(currentSortFunction)}
							displayValue={this.displayMemberName}
							multiple={true}
							showIDField={this.state.displayAdvanced}
							onChangeVisible={newVisibleItems => {
								this.setState({
									visibleItems: newVisibleItems
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
							}}
							filterValues={
								this.state.displayAdvanced
									? [
											filterValues.flightInput,
											filterValues.nameInput,
											filterValues.rankGreaterThan,
											filterValues.rankLessThan,
											filterValues.memberFilter
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
							fontStyle: 'italic'
						}}
						onClick={this.selectText}
						ref={this.selectableDiv}
					>
						{this.state.selectedMembers
							.map(mem => this.getEmail(mem))
							.filter(email => !!email)
							.join('; ')}
					</div>
				</>
			)
		) : (
			<div>Please sign in</div>
		);
	}

	private displayMemberName(member: MemberClasses): string {
		return member.getFullName();
	}

	private getEmail(member: MemberObject): string {
		return (
			member.contact.EMAIL.PRIMARY ||
			member.contact.CADETPARENTEMAIL.PRIMARY ||
			member.contact.EMAIL.SECONDARY ||
			member.contact.CADETPARENTEMAIL.SECONDARY ||
			member.contact.EMAIL.EMERGENCY ||
			member.contact.CADETPARENTEMAIL.EMERGENCY
		);
	}

	private selectText() {
		if (this.selectableDiv.current) {
			try {
				const range = document.createRange();
				range.selectNode(this.selectableDiv.current);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(range);
			} catch (e) {
				// Probably an old browser
				// (Looking at you, IE)
				return;
			}
		}
	}
}
