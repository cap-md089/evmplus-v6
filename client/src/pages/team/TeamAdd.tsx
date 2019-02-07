import * as React from 'react';
import TeamForm from 'src/components/forms/usable-forms/TeamForm';
import { CAPMemberClasses } from 'src/lib/Members';
import { TeamPublicity } from '../../enums';
import Page, { PageProps } from '../Page';
import Team from 'src/lib/Team';

interface TeamAddState {
	team: NewTeamObject;
	memberList: Promise<CAPMemberClasses[]>;
}

export default class TeamAdd extends Page<PageProps, TeamAddState> {
	public state: TeamAddState = {
		team: {
			cadetLeader: {
				type: 'Null'
			},
			seniorCoach: {
				type: 'Null'
			},
			seniorMentor: {
				type: 'Null'
			},
			description: '',
			members: [],
			name: '',
			visibility: TeamPublicity.PRIVATE
		},
		memberList: this.props.account.getMembers(this.props.member)
	};

	public constructor(props: PageProps) {
		super(props);

		this.onTeamChange = this.onTeamChange.bind(this);
		this.onTeamSubmit = this.onTeamSubmit.bind(this);
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (!this.props.member.hasPermission('AddTeam')) {
			return <div>You do not have permission to do that action</div>;
		}

		return (
			<TeamForm
				isTeamUpdate={false}
				memberList={this.state.memberList}
				onTeamChange={this.onTeamChange}
				onTeamFormSubmit={this.onTeamSubmit}
				team={this.state.team}
			/>
		);
	}

	private onTeamChange(team: NewTeamObject, valid: boolean) {
		this.setState({
			team
		});
	}

	private async onTeamSubmit(team: NewTeamObject, hasError: boolean) {
		if (hasError) {
			return;
		}

		if (!this.props.member) {
			return;
		}

		if (!this.props.member.hasPermission('AddTeam')) {
			return;
		}

		const newTeam = await Team.Create(
			team,
			this.props.member,
			this.props.account
		);

		this.props.routeProps.history.push(`/team/${newTeam.id}`);
	}
}
