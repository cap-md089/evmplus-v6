import * as React from 'react';
import Page, { PageProps } from '../Page';
import Team from 'src/lib/Team';
import { MemberClasses } from 'src/lib/Members';
import Loader from 'src/components/Loader';
import TeamForm from 'src/components/forms/usable-forms/TeamForm';

interface TeamEditState {
	team: Team | null;
	memberList: Promise<MemberClasses[]>;
}

export default class TeamEdit extends Page<PageProps<{ id: string }>, TeamEditState> {
	public state: TeamEditState = {
		team: null,
		memberList: this.props.account.getMembers(this.props.member)
	};

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.onTeamChange = this.onTeamChange.bind(this);
		this.onTeamSubmit = this.onTeamSubmit.bind(this);
	}

	public async componentDidMount() {
		if (parseInt(this.props.routeProps.match.params.id, 10) === 0) {
			this.props.routeProps.history.push('/team/view/0');
		}

		if (this.props.member) {
			this.props.updateSideNav([]);
			this.props.updateBreadCrumbs([]);
			this.updateTitle();

			const team = await Team.Get(
				parseInt(this.props.routeProps.match.params.id, 10),
				this.props.account,
				this.props.member
			);

			this.setState({
				team
			});

			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: `/team/${team.id}`,
					text: `View team "${team.name}"`
				},
				{
					target: `/team/edit/${team.id}`,
					text: `Edit team "${team.name}"`
				}
			]);
			this.updateTitle(`Edit team "${team.name}"`);
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (!this.state.team) {
			return <Loader />;
		}

		if (
			!(
				this.props.member.hasPermission('EditTeam') ||
				this.state.team.isLeader(this.props.member.getReference())
			)
		) {
			return <div>You do not have permission to do that</div>;
		}

		return (
			<TeamForm
				isTeamUpdate={true}
				memberList={this.state.memberList}
				onTeamChange={this.onTeamChange}
				onTeamFormSubmit={this.onTeamSubmit}
				team={this.state.team.toRaw()}
			/>
		);
	}

	private onTeamChange(team: NewTeamObject, valid: boolean) {
		if (!this.state.team) {
			return;
		}

		this.state.team.set(team);

		this.forceUpdate();
	}

	private async onTeamSubmit(team: NewTeamObject) {
		if (!this.props.member || !this.state.team) {
			return;
		}

		this.state.team.set(team);

		await this.state.team.save(this.props.member);

		this.props.routeProps.history.push(`/team/${this.state.team.id}`);
	}
}
