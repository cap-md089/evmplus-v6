import * as React from 'react';
import Page, { PageProps } from '../../Page';
import MemberBase, {
	CAPMemberClasses,
	CAPNHQMember,
	CAPProspectiveMember
} from '../../../lib/Members';
import Loader from '../../../components/Loader';
import { ShortCAPUnitDutyPosition } from 'common-lib';
import { DateTime } from 'luxon';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import Button from '../../../components/Button';
import SimpleForm, { Label, DateTimeInput } from '../../../components/forms/SimpleForm';
import Select from '../../../components/form-inputs/Select';

interface AddDutyPositionData {
	position: number;
	endDate: number;
}

interface TemporaryDutyPositionViewerEditorState {
	memberList: CAPMemberClasses[] | null;
	currentMember: CAPMemberClasses | null;
	addDutyPosition: AddDutyPositionData;
	showDutyPositionSave: boolean;
}

const highMarginTop = {
	marginTop: 40
};

const temporaryDutyPositions = [
	'Cadet Safety NCO',
	'Cadet Aerospace Education Officer',
	'Cadet Deputy Commander',
	'Cadet Operations Officer',
	'Cadet Recruiting Officer',
	'Cadet Leadership Officer',
	'Cadet WCAC Assistant',
	'Cadet Commander',
	'Cadet Historian Officer',
	'Cadet Safety Officer',
	'Cadet Executive Officer',
	'Cadet Activities NCO',
	'Cadet Administrative NCO',
	'Cadet Aerospace Education NCO',
	'Cadet Communications NCO',
	'Cadet Drug Demand Reduction NCO',
	'Cadet Emergency Services NCO',
	'Cadet Historian NCO',
	'Cadet Leadership NCO',
	'Cadet Logistics NCO',
	'Cadet Operations NCO',
	'Cadet Public Affairs NCO',
	'Cadet Recruiting NCO',
	'Cadet Supply NCO',
	'Cadet Activities Officer',
	'Cadet Public Affairs Officer',
	'Cadet Supply Officer',
	'Cadet Administrative Officer',
	'Cadet Flight Commander',
	'Cadet IT Officer',
	'Cadet IT Officer NCO',
	'Cadet WCAC Representative',
	'Cadet Flight Sergeant',
	'Cadet Emergency Services Officer',
	'Cadet First Sergeant',
	'Cadet Element Leader',
	'Finance Officer',
	'Health Services Officer',
	'Safety Officer',
	'Aerospace Education Officer',
	'Operations Officer',
	'Standardization/Evaluation Officer',
	'Character Development Instructor',
	'Communications Officer ',
	'Drug Demand Reduction Officer',
	'Activities Officer',
	'Administrative Officer',
	'Advisor to the Commander',
	'Alerting Officer',
	'Deputy Commander',
	'Deputy Commander for Cadets',
	'Disaster Preparedness Officer',
	'Emergency Services Officer',
	'Emergency Services Training Officer',
	'Historian',
	'Homeland Security Officer',
	'Information Technologies Officer',
	'Logistics Officer',
	'Personnel Officer',
	'Professional Development Officer',
	'Public Affairs Officer',
	'Recruiting & Retention Officer',
	'Search and Rescue Officer',
	'Squadron Activities Officer',
	'Testing Officer',
	'Transportation Officer',
	'Web Security Administrator',
	'Maintenance Officer',
	'Cadet Activities Officer',
	'Commander',
	'Deputy Commander for Seniors',
	'Squadron Leadership Officer',
	'Supply Officer'
];

export default class TemporaryDutyPositions extends Page<
	PageProps,
	TemporaryDutyPositionViewerEditorState
> {
	public state: TemporaryDutyPositionViewerEditorState = {
		memberList: null,
		currentMember: null,
		addDutyPosition: {
			position: 0,
			endDate: Date.now()
		},
		showDutyPositionSave: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.selectMember = this.selectMember.bind(this);
		this.onDutyPositionAddChange = this.onDutyPositionAddChange.bind(this);
		this.submitNewDutyPosition = this.submitNewDutyPosition.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		if (!this.props.member.hasPermission('AssignPosition')) {
			return;
		}

		const memberList = await this.props.account.getMembers(this.props.member);

		this.setState({
			memberList
		});

		this.updateTitle('Administration', 'Temporary Duty Positions');
		this.props.updateBreadCrumbs([
			{
				text: 'Home',
				target: '/'
			},
			{
				text: 'Administration',
				target: '/admin'
			},
			{
				text: 'Temporary Duty Positions',
				target: '/admin/tempdutypositions'
			}
		]);

		this.props.updateSideNav([]);
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in to view your temporary duty positions</div>;
		}

		if (!this.state.memberList) {
			return <Loader />;
		}

		const currentTemporaryDutyPositions = (this.props
			.member as CAPMemberClasses).dutyPositions.filter(
			pos => pos.type === 'CAPUnit'
		) as ShortCAPUnitDutyPosition[];

		const positionsView = (
			<>
				<h3>Current Temporary Duty Positions</h3>
				{currentTemporaryDutyPositions.length === 0 ? (
					<div>You do not currently have any temporary duty positions</div>
				) : (
					<ul>
						{currentTemporaryDutyPositions.map((pos, i) => (
							<li key={i}>
								{pos.duty} (Expires{' '}
								{DateTime.fromMillis(pos.expires).toLocaleString({
									...DateTime.DATETIME_SHORT,
									hour12: false
								})}
								)
							</li>
						))}
					</ul>
				)}
			</>
		);

		const positionsEdit = this.props.member.hasPermission('AssignPosition') ? (
			<div style={highMarginTop}>
				<h3>Assign temporary duty positions</h3>
				<MemberSelectorButton
					memberList={Promise.resolve(this.state.memberList)}
					title="Select a member"
					displayButtons={DialogueButtons.OK_CANCEL}
					onMemberSelect={this.selectMember}
				>
					Select a member
				</MemberSelectorButton>
				{this.state.currentMember ? (
					<div>
						<h3>Duty positions for {this.state.currentMember.getFullName()}</h3>
						{this.getDutyPositionListForMember()}
						{this.getDutyPositionAddForm()}
					</div>
				) : null}
			</div>
		) : null;

		return (
			<div>
				{positionsView}
				{positionsEdit}
			</div>
		);
	}

	private selectMember(currentMember: MemberBase | null) {
		if (
			currentMember instanceof CAPNHQMember ||
			currentMember instanceof CAPProspectiveMember ||
			currentMember === null
		) {
			this.setState({
				currentMember
			});
		}
	}

	private getRemover(index: number) {
		return (() => {
			if (!this.state.currentMember) {
				return;
			}
			if (!this.props.member) {
				return;
			}

			this.state.currentMember.dutyPositions.splice(index, 1);
			this.state.currentMember.saveTemporaryDutyPositions(this.props.member);

			this.forceUpdate();
		}).bind(this);
	}

	private getDutyPositionListForMember() {
		if (!this.state.currentMember) {
			return;
		}

		if (this.state.currentMember.dutyPositions.length === 0) {
			return <div>The selected member has no temporary duty positions active</div>;
		}

		return (
			<>
				<ul>
					{(this.state.currentMember.dutyPositions.filter(
						pos => pos.type === 'CAPUnit'
					) as ShortCAPUnitDutyPosition[]).map((pos, index) => (
						<li key={index}>
							{pos.duty} (Expires{' '}
							{DateTime.fromMillis(pos.expires).toLocaleString({
								...DateTime.DATETIME_SHORT,
								hour12: false
							})}
							){' '}
							<Button buttonType="none" onClick={this.getRemover(index)}>
								Remove this duty position
							</Button>
						</li>
					))}
				</ul>
			</>
		);
	}

	private getDutyPositionAddForm() {
		if (!this.state.currentMember) {
			return;
		}

		return (
			<>
				<h3>Add a temporary duty position</h3>
				<SimpleForm<AddDutyPositionData>
					onChange={this.onDutyPositionAddChange}
					onSubmit={this.submitNewDutyPosition}
					values={this.state.addDutyPosition}
					successMessage={this.state.showDutyPositionSave && 'Saved!'}
				>
					<Label>Duty Position to assign</Label>
					<Select name="position" labels={temporaryDutyPositions} />

					<Label>Duration of position</Label>
					<DateTimeInput
						account={this.props.account}
						date={true}
						time={true}
						name="endDate"
						originalTimeZoneOffset={'America/New_York'}
					/>
				</SimpleForm>
			</>
		);
	}

	private async submitNewDutyPosition(data: AddDutyPositionData) {
		if (!this.state.currentMember) {
			return;
		}
		if (!this.props.member) {
			return;
		}

		this.state.currentMember.dutyPositions.push({
			date: Date.now(),
			duty: temporaryDutyPositions[data.position],
			expires: data.endDate,
			type: 'CAPUnit'
		});

		this.state.currentMember.saveTemporaryDutyPositions(this.props.member);

		this.setState({
			showDutyPositionSave: true,
			addDutyPosition: {
				endDate: Date.now(),
				position: 0
			}
		});
	}

	private onDutyPositionAddChange(data: AddDutyPositionData) {
		this.setState({
			addDutyPosition: data,
			showDutyPositionSave: false
		});
	}
}