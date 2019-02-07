import * as React from 'react';
import { Link } from 'react-router-dom';
import Selector, { CheckInput } from 'src/components/form-inputs/Selector';
import { TextInput } from 'src/components/forms/Form';
import Loader from 'src/components/Loader';
import { CAPNHQMember, CAPMemberClasses, CAPProspectiveMember } from 'src/lib/Members';
import Page, { PageProps } from 'src/pages/Page';
import Button from 'src/components/Button';
import SimpleForm, { Label, RadioButton, Checkbox } from 'src/components/forms/SimpleForm';

import './FlightContact.css';

export const shouldRenderFlightContactWidget = (props: PageProps) => {
	return (
		props.member instanceof CAPNHQMember &&
		props.member.hasDutyPosition([
			'Cadet Flight Commander',
			'Cadet Flight Sergeant',
			'Cadet Commander',
			'Cadet Deputy Commander'
		])
	);
};

interface FlightContactState {
	members: CAPMemberClasses[] | null;
}

export class FlightContactWidget extends Page<PageProps, FlightContactState> {
	public state: FlightContactState = {
		members: null
	};

	public async componentDidMount() {
		if (
			this.props.member &&
			this.props.member instanceof CAPNHQMember &&
			this.props.member.hasDutyPosition([
				'Cadet Flight Commander',
				'Cadet Flight Sergeant',
				'Cadet Commander',
				'Cadet Deputy Commander'
			])
		) {
			const members = await this.props.member.getFlightMembers();

			this.setState({
				members
			});
		}
	}

	public render() {
		return (
			<div className="widget">
				<Link to="/admin/flightcontact">
					<div className="widget-title">Flight Contact</div>
				</Link>
				<div className="widget-body">
					{this.state.members === null ? (
						<Loader />
					) : (
						<div>
							There are {this.state.members.length} members in your flight
							<br />
							<br />
							<Link to="/admin/flightcontact">Connect with them</Link>
						</div>
					)}
				</div>
			</div>
		);
	}
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
	selectedMembers: CAPMemberClasses[];
	availableMembers: null | (CAPMemberClasses[]);
	sortFunction: RadioReturn<SortFunction>;
	visibleItems: CAPMemberClasses[];
	displayAdvanced: boolean;
	filterValues: {
		nameInput: string;
		rankGreaterThan: string;
		rankLessThan: string;
		flightInput: string;
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

const flightInput: CheckInput<Member, string> = {
	check: (mem, input) => {
		if (input === undefined || input === '') {
			return true;
		}

		if (mem.flight === null) {
			return false;
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

const advancedFilters1 = [nameInput, rankGreaterThan, rankLessThan, flightInput];
const advancedFilters2 = [nameInput, rankGreaterThan, rankLessThan];

const simpleFilters1 = [nameInput, flightInput];
const simpleFilters2 = [nameInput];

interface SelectorFormValues {
	members: CAPMemberClasses[];
	sortFunction: RadioReturn<SortFunction>;
	displayAdvanced: boolean;
}

export default class FlightContact extends Page<PageProps, EmailListState> {
	public state: EmailListState = {
		availableMembers: null,
		displayAdvanced: false,
		filterValues: {
			nameInput: '',
			rankGreaterThan: '',
			rankLessThan: '',
			flightInput: ''
		},
		selectedMembers: [],
		sortFunction: [SortFunction.CAPID, ''],
		visibleItems: []
	};

	private selectableDiv = React.createRef<HTMLDivElement>();

	public constructor(props: PageProps) {
		super(props);

		this.selectText = this.selectText.bind(this);
	}

	public async componentDidMount() {
		if (
			this.props.member &&
			this.props.member instanceof CAPNHQMember &&
			this.props.member.hasDutyPosition([
				'Cadet Flight Commander',
				'Cadet Flight Sergeant',
				'Cadet Commander',
				'Cadet Deputy Commander'
			])
		) {
			const members = await this.props.member.getFlightMembers();

			this.setState({
				availableMembers: members
			});

			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/admin',
					text: 'Administration'
				},
				{
					target: '/admin/flightcontact',
					text: 'Flight contact'
				}
			]);

			this.props.updateSideNav([]);

			this.updateTitle('Email selector');
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (
			!(
				this.props.member instanceof CAPNHQMember &&
				this.props.member.hasDutyPosition([
					'Cadet Flight Commander',
					'Cadet Flight Sergeant',
					'Cadet Commander',
					'Cadet Deputy Commander'
				])
			)
		) {
			return <div>You do not have permission to do that</div>;
		}

		if (this.state.availableMembers === null) {
			return <Loader />;
		}

		const currentSortFunction = sortFunctions[this.state.sortFunction[0]];

		const filterValues = this.state.filterValues;

		return (
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
							const selectedMembers: CAPMemberClasses[] = prev.selectedMembers.slice(0);

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
						displayAdvanced: this.state.displayAdvanced
					}}
					onChange={({ members, sortFunction, displayAdvanced }) => {
						this.setState({
							selectedMembers: members,
							sortFunction,
							displayAdvanced
						});
					}}
				>
					<Label>Select how to sort</Label>
					<RadioButton<SortFunction>
						name="sortFunction"
						labels={['Last name', 'First name', 'CAPID']}
					/>

					<Label>Show advanced filters</Label>
					<Checkbox name="displayAdvanced" />

					<Selector<CAPMemberClasses>
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
						filters={this.getFilters()}
						onFilterValuesChange={values => {
							if (!this.state.displayAdvanced) {
								this.setState(prev => ({
									filterValues: {
										...prev.filterValues,
										nameInput: values[0],
										flightInput: values[1]
									}
								}));
							} else {
								this.setState({
									filterValues: {
										nameInput: values[0],
										rankGreaterThan: values[1],
										rankLessThan: values[2],
										flightInput: values[3]
									}
								});
							}
						}}
						filterValues={
							this.state.displayAdvanced
								? [
										filterValues.nameInput,
										filterValues.rankGreaterThan,
										filterValues.rankLessThan,
										filterValues.flightInput
								  ]
								: [filterValues.nameInput, filterValues.flightInput]
						}
					/>
				</SimpleForm>
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
				<h2>Phone numbers:</h2>
				<div
					style={{
						height: 400,
						width: '98%',
						overflow: 'auto',
						border: '1px solid black',
						boxSizing: 'border-box',
						margin: 0,
						fontStyle: 'italic'
					}}
				>
					{this.getPhoneNumbers()}
				</div>
			</>
		);
	}

	private displayMemberName(member: CAPMemberClasses): string {
		return member.getFullName();
	}

	private getEmail(member: CAPMemberClasses): string {
		return member.getBestEmail();
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

	private getFilters() {
		if (
			this.props.member instanceof CAPNHQMember ||
			this.props.member instanceof CAPProspectiveMember
		) {
			if (this.props.member.hasDutyPosition(['Cadet Commander', 'Cadet Deputy Commander'])) {
				return this.state.displayAdvanced ? advancedFilters1 : simpleFilters1;
			} else {
				return this.state.displayAdvanced ? advancedFilters2 : simpleFilters2;
			}
		} else {
			throw new Error('Weird');
		}
	}

	private getPhoneNumbers() {
		return this.state
			.selectedMembers!.map(this.renderMember)
			.filter(item => item.phoneCount > 0)
			.map(item => item.element);
	}

	private renderMember(member: CAPMemberClasses) {
		const phoneCount = [
			member.contact.CADETPARENTEMAIL.PRIMARY,
			member.contact.CADETPARENTEMAIL.SECONDARY,
			member.contact.CADETPARENTEMAIL.EMERGENCY,
			member.contact.CELLPHONE.PRIMARY,
			member.contact.CELLPHONE.SECONDARY,
			member.contact.CELLPHONE.EMERGENCY,
			member.contact.HOMEPHONE.PRIMARY,
			member.contact.HOMEPHONE.SECONDARY,
			member.contact.HOMEPHONE.EMERGENCY,
			member.contact.WORKPHONE.PRIMARY,
			member.contact.WORKPHONE.SECONDARY,
			member.contact.WORKPHONE.EMERGENCY
		].filter(item => item !== '').length;

		return {
			phoneCount,
			element: (
				<div className="flightcontactlist-item">
					<div className="flightcontactlist-name">{member.getFullName()}</div>
					<div className="flightcontactlist-phones">
						{member.contact.CADETPARENTPHONE.PRIMARY !== '' ? (
							<p>
								{member.contact.CADETPARENTPHONE.PRIMARY} (Primary Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CADETPARENTPHONE.SECONDARY !== '' ? (
							<p>
								{member.contact.CADETPARENTPHONE.SECONDARY} (Secondary Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CADETPARENTPHONE.EMERGENCY !== '' ? (
							<p>
								{member.contact.CADETPARENTPHONE.EMERGENCY} (Emergency Cadet Parent
								Phone)
							</p>
						) : null}
						{member.contact.CELLPHONE.PRIMARY !== '' ? (
							<p>{member.contact.CELLPHONE.PRIMARY} (Primary Cell Phone)</p>
						) : null}
						{member.contact.CELLPHONE.SECONDARY !== '' ? (
							<p>{member.contact.CELLPHONE.SECONDARY} (Secondary Cell Phone)</p>
						) : null}
						{member.contact.CELLPHONE.EMERGENCY !== '' ? (
							<p>{member.contact.CELLPHONE.EMERGENCY} (Emergency Cell Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.PRIMARY !== '' ? (
							<p>{member.contact.HOMEPHONE.PRIMARY} (Primary Home Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.SECONDARY !== '' ? (
							<p>{member.contact.HOMEPHONE.SECONDARY} (Secondary Home Phone)</p>
						) : null}
						{member.contact.HOMEPHONE.EMERGENCY !== '' ? (
							<p>{member.contact.HOMEPHONE.EMERGENCY} (Emergency Home Phone)</p>
						) : null}
						{member.contact.WORKPHONE.PRIMARY !== '' ? (
							<p>{member.contact.WORKPHONE.PRIMARY} (Primary Work Phone)</p>
						) : null}
						{member.contact.WORKPHONE.SECONDARY !== '' ? (
							<p>{member.contact.WORKPHONE.SECONDARY} (Secondary Work Phone)</p>
						) : null}
						{member.contact.WORKPHONE.EMERGENCY !== '' ? (
							<p>{member.contact.WORKPHONE.EMERGENCY} (Emergency Work Phone)</p>
						) : null}
					</div>
				</div>
			)
		};
	}
}
