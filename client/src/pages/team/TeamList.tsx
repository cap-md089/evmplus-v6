import * as React from 'react';
import Page, { PageProps } from '../Page';
import Team from 'src/lib/Team';
import Loader from 'src/components/Loader';
import { TeamPublicity } from '../../../../lib';

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
						<h1>{team.name}</h1>
						{team.visibility === TeamPublicity.PUBLIC ||
						this.props.member ? (
							<div>This team has {team.members.length} member(s)</div>
						) : null}
					</div>
				))}
			</div>
		);
	}
}
