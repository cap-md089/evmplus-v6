import * as React from 'react';
import Team from 'src/lib/Team';
import Button from '../Button';
import DownloadDialogue from '../DownloadDialogue';
import TextInput from './TextInput';
import { DisabledText, FormBlock, Label, TextBox } from '../SimpleForm';
import { NotOptionalInputProps } from './Input';
import Loader from '../Loader';

interface TeamSelectorState {
	teams: Team[] | null;
	open: boolean;
	selectedValue: Team | null;
	filterValues: any[];
}

export default class TeamSelector extends React.Component<
	NotOptionalInputProps<number | null>,
	TeamSelectorState
> {
	public state: TeamSelectorState = {
		open: false,
		filterValues: [],
		selectedValue: null,
		teams: null
	};

	public constructor(props: NotOptionalInputProps<number>) {
		super(props);

		this.onTeamDialogueFilterValueChange = this.onTeamDialogueFilterValueChange.bind(
			this
		);
		this.selectTeam = this.selectTeam.bind(this);
		this.setSelectedTeam = this.setSelectedTeam.bind(this);
		this.openTeamDialogue = this.openTeamDialogue.bind(this);
	}

	public async componentDidMount() {
		const teams = await this.props.account.getTeams(this.props.member);
		this.setState({
			teams
		});
	}

	public render() {
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
					<DownloadDialogue<Team>
						open={this.state.open}
						multiple={false}
						overflow={400}
						title="Select a team"
						showIDField={false}
						displayValue={this.displayTeam}
						valuePromise={this.state.teams}
						filters={[
							{
								check: (team, input) => {
									if (
										input === '' ||
										typeof input !== 'string'
									) {
										return true;
									}

									try {
										return !!team.name.match(
											new RegExp(input, 'gi')
										);
									} catch (e) {
										return false;
									}
								},
								displayText: 'Team name',
								filterInput: TextInput
							}
						]}
						onValueClick={this.setSelectedTeam}
						onValueSelect={this.selectTeam}
						selectedValue={this.state.selectedValue}
					/>
				</TextBox>

				<Label>Team ID</Label>
				<TextInput disabled={true} name="teamID" value={teamID} />

				<Label>Team Name</Label>
				<DisabledText
					name="teamName"
					value={targetTeam ? targetTeam.name : ''}
				/>
			</FormBlock>
		);
	}

	private displayTeam(team: Team) {
		return team.name;
	}

	private onTeamDialogueFilterValueChange(filterValues: any[]) {
		this.setState({
			filterValues
		});
	}

	private setSelectedTeam(selectedValue: Team) {
		this.setState({
			selectedValue
		});
	}

	private selectTeam(selectedValue: Team | null) {
		this.setState({
			selectedValue
		});

		this.setState({
			open: false
		});

		if (this.props.onChange) {
			this.props.onChange(selectedValue ? selectedValue.id : null);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: selectedValue ? selectedValue.id : null
			});
		}
	}

	private openTeamDialogue() {
		this.setState({
			open: true
		});
	}
}
