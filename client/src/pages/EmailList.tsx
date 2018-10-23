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
} from '../components/SimpleForm';
import myFetch from '../lib/myFetch';
import { PageProps } from './Page';

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

interface EmailListState {
	selectedMembers: MemberObject[];
	availableMembers: null | (MemberObject[]);
	sortFunction: RadioReturn<SortFunction>;
	visibleItems: MemberObject[];
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

const sortFunctions: Array<(a: MemberObject, b: MemberObject) => number> = [
	(a, b) => a.nameLast.localeCompare(b.nameLast),
	(a, b) => a.nameFirst.localeCompare(b.nameFirst),
	(a, b) => a.id - b.id
];

enum MemberList {
	CADET,
	SENIOR,
	ALL
}

const flightInput: CheckInput<MemberObject, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (!!input.match(/senior/i)) {
			return mem.seniorMember;
		}

		try {
			return mem.flight ? false : !!input.match(new RegExp(input, 'i'));
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

const rankGreaterThan: CheckInput<MemberObject, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (memberRanks.indexOf(normalizeRankInput(input)) === -1) {
			return true;
		}

		return (
			memberRanks.indexOf(normalizeRankInput(mem.memberRank)) >=
			memberRanks.indexOf(normalizeRankInput(input))
		);
	},
	displayText: 'Rank greater than:',
	filterInput: TextInput
};

const rankLessThan: CheckInput<MemberObject, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (memberRanks.indexOf(normalizeRankInput(input)) === -1) {
			return true;
		}

		return (
			memberRanks.indexOf(normalizeRankInput(mem.memberRank)) <=
			memberRanks.indexOf(normalizeRankInput(input))
		);
	},
	displayText: 'Rank less than:',
	filterInput: TextInput
};

const memberFilter: CheckInput<MemberObject, MemberList> = {
	check: (mem, input) => {
		return memberFilters[
			typeof input === 'undefined' || input === -1
				? MemberList.ALL
				: input
		](mem);
	},
	filterInput: (props: SimpleRadioProps<MemberList>) => (
		<SimpleRadioButton
			labels={['Cadets', 'Senior Members', 'All']}
			name=""
			value={
				typeof props.value === 'undefined'
					? MemberList.ALL
					: props.value
			}
			onChange={props.onChange}
			onInitialize={props.onInitialize}
			onUpdate={props.onUpdate}
		/>
	),
	displayText: 'Member type'
};

const memberFilters: Array<(a: MemberObject) => boolean> = [
	a => !a.seniorMember,
	a => a.seniorMember,
	a => true
];

export default class EmailList extends React.Component<
	PageProps,
	EmailListState
> {
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

	public componentDidMount() {
		if (this.props.member.valid) {
			myFetch('/api/member', {
				headers: {
					authorization: this.props.member.sessionID
				}
			})
				.then(res => res.json())
				.then((availableMembers: MemberObject[]) =>
					this.setState({ availableMembers })
				);
		}
	}

	public render() {
		const MemberSelector = Selector as new () => Selector<MemberObject>;

		const SelectorForm = SimpleForm as new () => SimpleForm<{
			members: MemberObject[];
			sortFunction: RadioReturn<SortFunction>;
			displayAdvanced: boolean;
		}>;

		const SortSelector = RadioButton as new () => RadioButton<SortFunction>;

		const currentSortFunction = sortFunctions[this.state.sortFunction[0]];

		const filterValues = this.state.filterValues;

		return this.props.member.valid ? (
			this.state.availableMembers === null ? (
				<Loader />
			) : (
				<>
					<Button
						onClick={() => {
							this.setState(prev => ({
								selectedMembers: (
									prev.availableMembers || []
								).slice(0)
							}));
						}}
					>
						Select all
					</Button>
					&nbsp; &nbsp; &nbsp;
					<Button
						onClick={() => {
							this.setState(prev => ({
								selectedMembers: prev.visibleItems.slice(0)
							}));
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
					<SelectorForm
						showSubmitButton={false}
						values={{
							members: this.state.selectedMembers,
							sortFunction: this.state.sortFunction,
							displayAdvanced: this.state.displayAdvanced
						}}
						onChange={({
							members,
							sortFunction,
							displayAdvanced
						}) => {
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
							values={this.state.availableMembers
								.slice(0)
								.sort(currentSortFunction)}
							displayValue={this.displayMemberName}
							multiple={true}
							showIDField={this.state.displayAdvanced}
							onChangeVisible={visibleItems => {
								this.setState({ visibleItems });
							}}
							overflow={750}
							filters={
								this.state.displayAdvanced
									? [
											flightInput,
											nameInput,
											rankGreaterThan,
											rankLessThan,
											memberFilter
									  ]
									: [nameInput, memberFilter]
							}
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
									: [
											filterValues.nameInput,
											filterValues.memberFilter
									  ]
							}
						/>
					</SelectorForm>
					<h2>Emails:</h2>
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
							.join('; ')}
					</div>
				</>
			)
		) : (
			<div>Please sign in</div>
		);
	}

	private displayMemberName(member: MemberObject): string {
		return (
			member.memberRank +
			' ' +
			[
				member.nameFirst,
				member.nameMiddle,
				member.nameLast,
				member.nameSuffix
			]
				.filter(x => x !== null && x !== undefined && x !== '')
				.join(' ')
		);
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
			const range = document.createRange();
			range.selectNode(this.selectableDiv.current);
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);
		}
	}
}
