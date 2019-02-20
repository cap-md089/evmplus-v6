import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../Page';
import Team from '../../lib/Team';
import Loader from '../../components/Loader';
import { TeamPublicity } from 'common-lib/index';

interface TeamListState {
	teams: Team[] | null;
}

export default class TeamList extends Page<PageProps, TeamListState> {
	public state: TeamListState = {
		teams: null
	};

	public constructor(props: PageProps) {
		super(props);
	}

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/team/list',
				text: 'Team list'
			}
		]);
		this.props.updateSideNav([]);
		this.updateTitle('Team list');

		const teams = await this.props.account.getTeams(this.props.member);

		this.props.updateSideNav(
			teams.map(team => ({
				target: team.id.toString(),
				text: team.name,
				type: 'Reference' as 'Reference'
			}))
		);

		this.setState({
			teams
		});
	}

	public render() {
		if (this.state.teams === null) {
			return <Loader />;
		}

		return (
			<div>
				{this.props.member && this.props.member.hasPermission('AddTeam') ? (
					<Link to="/team/create">Add team</Link>
				) : null}
				{this.state.teams.map((team, i) => (
					<div key={i}>
						<Link to={`/team/${team.id}`}>
							<h1 id={team.id.toString()}>{team.name}</h1>
						</Link>
						<p>{team.description || <i>Team has no description</i>}</p>
						{team.visibility === TeamPublicity.PUBLIC || this.props.member ? (
							<div>This team has {team.members.length} member(s)</div>
						) : null}
					</div>
				))}
			</div>
		);
	}
}
