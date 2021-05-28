/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { get, RawTeamObject } from 'common-lib';
import * as React from 'react';
import Button from '../Button';
import DownloadDialogue from '../dialogues/DownloadDialogue';
import { DisabledText, FormBlock, Label, TextBox } from '../forms/SimpleForm';
import Loader from '../Loader';
import { InputProps } from './Input';
import { CheckInput } from './Selector';
import TextInput from './TextInput';

interface TeamSelectorProps extends InputProps<number | null> {
	teamList: RawTeamObject[];
}

interface TeamSelectorState {
	teams: RawTeamObject[] | null;
	open: boolean;
	selectedValue: RawTeamObject | null;
	filterValues: [string];
}

export default class TeamSelector extends React.Component<TeamSelectorProps, TeamSelectorState> {
	public state: TeamSelectorState = {
		open: false,
		filterValues: [''],
		selectedValue: null,
		teams: null,
	};

	public constructor(props: TeamSelectorProps) {
		super(props);

		this.onTeamDialogueFilterValueChange = this.onTeamDialogueFilterValueChange.bind(this);
		this.selectTeam = this.selectTeam.bind(this);
		this.setSelectedTeam = this.setSelectedTeam.bind(this);
		this.openTeamDialogue = this.openTeamDialogue.bind(this);
	}

	public componentDidMount(): void {
		const teams = this.props.teamList;
		this.setState({
			teams,
		});
	}

	public render(): JSX.Element {
		if (this.state.teams === null) {
			return <Loader />;
		}

		const teamID =
			this.props.value === null || this.props.value === undefined
				? ''
				: this.props.value.toString();

		const targetTeam = this.state.teams
			? this.state.teams.filter(team => team.id.toString() === teamID)[0]
			: undefined;

		return (
			<FormBlock name={this.props.name}>
				<Label />

				<TextBox name="null">
					<Button onClick={this.openTeamDialogue} buttonType="none">
						Select a team
					</Button>
					<DownloadDialogue<RawTeamObject, [string]>
						open={this.state.open}
						multiple={false}
						onCancel={() => this.selectTeam(null)}
						overflow={400}
						title="Select a team"
						showIDField={false}
						displayValue={get('name')}
						valuePromise={this.state.teams}
						filters={
							[
								{
									check: (team, input) => {
										if (input === '' || typeof input !== 'string') {
											return true;
										}

										try {
											return !!new RegExp(input, 'gi').exec(team.name);
										} catch (e) {
											return false;
										}
									},
									displayText: 'Team name',
									filterInput: TextInput,
								} as CheckInput<RawTeamObject, string>,
							] as const
						}
						onValueClick={this.setSelectedTeam}
						onValueSelect={this.selectTeam}
						selectedValue={this.state.selectedValue}
						filterValues={this.state.filterValues}
					/>
				</TextBox>

				<Label>Team ID</Label>
				<TextInput disabled={true} name="teamID" value={teamID} />

				<Label>Team Name</Label>
				<DisabledText name="teamName" value={targetTeam ? targetTeam.name : ''} />
			</FormBlock>
		);
	}

	private onTeamDialogueFilterValueChange = (filterValues: [string]): void => {
		this.setState({
			filterValues,
		});
	};

	private setSelectedTeam = (selectedValue: RawTeamObject | null): void => {
		this.setState({
			selectedValue,
		});
	};

	private selectTeam = (selectedValue: RawTeamObject | null): void => {
		this.setState({
			selectedValue,
			open: false,
		});

		if (this.props.onChange) {
			this.props.onChange(selectedValue ? selectedValue.id : null);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: selectedValue ? selectedValue.id : null,
			});
		}
	};

	private openTeamDialogue = (): void => {
		this.setState({
			open: true,
		});
	};
}
