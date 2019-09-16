import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../Page';
import MemberBase, { CAPMemberClasses } from '../../lib/Members';
import Team from '../../lib/Team';
import Loader from '../../components/Loader';
import DialogueButton from '../../components/dialogues/DialogueButton';
import { DialogueButtons } from '../../components/dialogues/Dialogue';

interface TeamViewState {
	members: CAPMemberClasses[] | null;
	team: Team | null;
	error: number;
}

export default class TeamView extends Page<PageProps<{ id: string }>, TeamViewState> {
	public state: TeamViewState = {
		members: null,
		team: null,
		error: 200
	};

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.deleteTeam = this.deleteTeam.bind(this);
	}

	public async componentDidMount() {
		let team: Team;

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/team',
				text: 'Team list'
			}
		]);
		this.props.updateSideNav([]);

		try {
			team = await Team.Get(
				parseInt(this.props.routeProps.match.params.id, 10),
				this.props.account,
				this.props.member
			);
		} catch (e) {
			return this.setState({
				error: 404
			});
		}

		this.setState({
			team
		});

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/team',
				text: 'Team list'
			},
			{
				target: `/team/${team.id}`,
				text: `View team "${team.name}"`
			}
		]);
		this.updateTitle(`View team "${team.name}"`)

		if (team.canGetFullMembers(this.props.member)) {
			const members = await team.getFullMembers(this.props.member);

			this.setState({
				members
			});
		} else {
			this.setState({
				members: []
			});
		}
	}

	public render() {
		if (this.state.error === 404) {
			return <div>Team not found</div>;
		}

		if (this.state.team === null || this.state.members === null) {
			return <Loader />;
		}

		const emails = this.getEmails();

		return (
			<div>
				{this.props.member && this.props.member.hasPermission('ManageTeam') && this.state.team.id !== 0 ? (
					<>
						<Link to={`/team/edit/${this.state.team.id}`}>Edit team</Link>
						{' | '}
						<DialogueButton
							buttonText="Delete team"
							buttonType="none"
							buttonClass="underline-button"
							displayButtons={DialogueButtons.OK_CANCEL}
							onOk={this.deleteTeam}
							title="Delete team"
							labels={['Yes', 'No']}
						>
							Really delete team?
						</DialogueButton>
					</>
				) : null}
				<h1>{this.state.team.name}</h1>
				<p>{this.state.team.description || <i>No team description</i>}</p>
				{this.state.team.seniorCoachName !== '' ? (
					<p>Senior member coach: {this.state.team.seniorCoachName}</p>
				) : null}
				{this.state.team.seniorMentorName !== '' ? (
					<p>Senior member mentor: {this.state.team.seniorMentorName}</p>
				) : null}
				{this.state.team.cadetLeaderName !== '' ? (
					<p>Cadet leader: {this.state.team.cadetLeaderName}</p>
				) : null}
				{this.state.team.canGetFullMembers(this.props.member)
					? this.state.members.map((member, i) => (
							<div key={i}>
								{member.getFullName()} (<i>{member.getBestEmail()}</i>):{' '}
								{
									this.state.team!.members.filter(mem =>
										member.matchesReference(mem.reference)
									)[0].job
								}
							</div>
					  ))
					: this.state.team.members.map((member, i) => (
							<div key={i}>
								{member.name}: {member.job}
							</div>
					  ))}
				{this.props.member && this.state.team.isLeader(this.props.member.getReference()) ? (
					<>
						<h2>Team member emails</h2>
						<div>{emails}</div>
					</>
				) : null}
			</div>
		);
	}

	private async deleteTeam() {
		if (!this.props.member) {
			return;
		}

		if (!this.state.team) {
			return;
		}

		if (!this.props.member.hasPermission('ManageTeam')) {
			return;
		}

		await this.state.team.delete(this.props.member);

		this.props.routeProps.history.push('/team');
	}

	private getEmails() {
		if (
			!this.props.member ||
			!this.state.team ||
			!this.state.members ||
			!this.state.team.isLeader(this.props.member.getReference())
		) {
			return '';
		}

		const emailList = [];

		for (const member of this.state.team.members) {
			const memberObj = this.state.members.filter(mem =>
				MemberBase.AreMemberReferencesTheSame(mem, member.reference)
			);

			if (memberObj.length === 1) {
				const cont = memberObj[0].contact;

				if (cont.EMAIL.PRIMARY && emailList.indexOf(cont.EMAIL.PRIMARY) === -1) {
					emailList.push(cont.EMAIL.PRIMARY);
				}
				if (cont.EMAIL.SECONDARY && emailList.indexOf(cont.EMAIL.SECONDARY) === -1) {
					emailList.push(memberObj[0].contact.EMAIL.SECONDARY);
				}
				if (cont.EMAIL.EMERGENCY && emailList.indexOf(cont.EMAIL.EMERGENCY) === -1) {
					emailList.push(memberObj[0].contact.EMAIL.EMERGENCY);
				}
				if (cont.CADETPARENTEMAIL.PRIMARY && emailList.indexOf(cont.CADETPARENTEMAIL.PRIMARY) === -1) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.PRIMARY);
				}
				if (cont.CADETPARENTEMAIL.SECONDARY && emailList.indexOf(cont.CADETPARENTEMAIL.SECONDARY) === -1) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.SECONDARY);
				}
				if (cont.CADETPARENTEMAIL.EMERGENCY && emailList.indexOf(cont.CADETPARENTEMAIL.EMERGENCY) === -1) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.EMERGENCY);
				}
			}
		}

		return emailList.filter(e => !!e).join('; ');
	}
}
