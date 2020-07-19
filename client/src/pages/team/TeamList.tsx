import { TeamPublicity, Either, always, FullTeamObject, hasPermission } from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';
import Page, { PageProps } from '../Page';
import fetchApi from '../../lib/apis';

interface TeamListLoadingState {
	state: 'LOADING';
}

interface TeamListLoadedState {
	state: 'LOADED';
	teams: FullTeamObject[];
}

interface TeamListErrorState {
	state: 'ERROR';
}

type TeamListState = TeamListLoadedState | TeamListLoadingState | TeamListErrorState;

export default class TeamList extends Page<PageProps, TeamListState> {
	public state: TeamListState = {
		state: 'LOADING'
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

		const teamsEither = await fetchApi.team.list({}, {}, this.props.member?.sessionID);

		if (Either.isLeft(teamsEither)) {
			this.setState(
				always({
					state: 'ERROR'
				})
			);
		} else {
			const teams = teamsEither.value;

			this.props.updateSideNav(
				teams.map(team => ({
					target: team.id.toString(),
					text: team.name,
					type: 'Reference' as 'Reference'
				}))
			);

			this.setState({
				state: 'LOADED',
				teams
			});
		}
	}

	public render() {
		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>There was an error getting the teams list</div>;
		}

		return (
			<div>
				{this.props.member && hasPermission('ManageTeam')()(this.props.member) ? (
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
