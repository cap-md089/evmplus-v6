import * as React from 'react';
import { Link } from 'react-router-dom';
import Loader from 'src/components/Loader';
import Team from 'src/lib/Team';
import { TeamPublicity } from '../../../../lib';
import Page, { PageProps } from '../Page';

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
		const teams = await this.props.account.getTeams();

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
				{this.state.teams.map((team, i) => (
					<div key={i}>
						<Link to={`/team/${team.id}`}>
							<h1>{team.name}</h1>
						</Link>
						<p>
							{team.description || <i>Team has no description</i>}
						</p>
						{team.visibility === TeamPublicity.PUBLIC ||
						this.props.member ? (
							<div>
								This team has {team.members.length} member(s)
							</div>
						) : null}
					</div>
				))}
			</div>
		);
	}
}
