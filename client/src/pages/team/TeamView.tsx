import * as React from 'react';
import { Link } from 'react-router-dom';
import { DialogueButtons } from 'src/components/Dialogue';
import DialogueButton from 'src/components/DialogueButton';
import Loader from 'src/components/Loader';
import { MemberClasses } from 'src/lib/Members';
import Team from 'src/lib/Team';
import Page, { PageProps } from '../Page';

interface TeamViewState {
	members: MemberClasses[] | null;
	team: Team | null;
	error: number;
}

export default class TeamView extends Page<
	PageProps<{ id: string }>,
	TeamViewState
> {
	public state: TeamViewState = {
		members: null,
		team: null,
		error: 200
	};

	public async componentDidMount() {
		let team: Team;

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

		return (
			<div>
				{this.props.member &&
				this.props.member.hasPermission('EditTeam') ? (
					<>
						<Link to={`/team/edit/${this.state.team.id}`}>
							Edit team
						</Link>
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
				<p>
					{this.state.team.description || <i>No team description</i>}
				</p>
				{this.state.team.seniorCoachName !== '' ? (
					<p>
						Senior member coach: {this.state.team.seniorCoachName}
					</p>
				) : null}
				{this.state.team.seniorMentorName !== '' ? (
					<p>
						Senior member mentor: {this.state.team.seniorMentorName}
					</p>
				) : null}
				{this.state.team.cadetLeaderName !== '' ? (
					<p>Cadet leader: {this.state.team.cadetLeaderName}</p>
				) : null}
				{this.state.team.canGetFullMembers(this.props.member)
					? this.state.members.map((member, i) => (
							<div key={i}>
								{member.getFullName()} (
								<i>{member.getBestEmail()}</i>)
							</div>
					  ))
					: this.state.team.members.map((member, i) => (
							<div key={i}>{member.name}</div>
					  ))}
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

		if (!this.props.member.hasPermission('EditTeam')) {
			return;
		}

		await this.state.team.delete(this.props.member);

		this.props.routeProps.history.push('/team');
	}
}
