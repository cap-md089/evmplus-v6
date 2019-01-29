import * as React from 'react';
import { MemberClasses } from 'src/lib/Members';
import { TeamPublicity } from '../../../enums';
import MemberSelector from '../../dialogues/MemberSelector';
import TeamMemberInput, {
	TeamMemberInputProps
} from '../../form-inputs/TeamMemberInput';
import SimpleForm, {
	BigTextBox,
	BooleanFields,
	Label,
	ListEditor,
	SimpleRadioButton,
	TextInput,
	FormValidator,
	Divider,
	TextBox
} from '../SimpleForm';

interface TeamFormProps {
	team: NewTeamObject;
	isTeamUpdate?: boolean;
	memberList: Promise<MemberClasses[]>;
	onTeamChange: (event: NewTeamObject, valid: boolean) => void;
	onTeamFormSubmit: (event: NewTeamObject, valid: boolean) => void;
}

const teamValidator: FormValidator<NewTeamObject> = {
	name: name => name === '',
	visibility: visibility =>
		visibility !== TeamPublicity.PRIVATE &&
		visibility !== TeamPublicity.PUBLIC
};

export default class TeamForm extends React.Component<TeamFormProps> {
	public constructor(props: TeamFormProps) {
		super(props);

		this.onTeamChange = this.onTeamChange.bind(this);
		this.onTeamSubmit = this.onTeamSubmit.bind(this);
	}

	public render() {
		return (
			<SimpleForm<NewTeamObject>
				onChange={this.onTeamChange}
				onSubmit={this.onTeamSubmit}
				submitInfo={{
					text: this.props.isTeamUpdate
						? 'Update team'
						: 'Create team'
				}}
				values={this.props.team}
				validator={teamValidator}
			>
				<Label>Team name</Label>
				<TextInput
					name="name"
					errorMessage="Team name must not be empty"
				/>

				<Label>Team description</Label>
				<BigTextBox name="description" />

				<Label>Cadet team leader</Label>
				<MemberSelector
					memberList={this.props.memberList}
					name="cadetLeader"
				/>

				<Divider />

				<Label>Senior mentor</Label>
				<MemberSelector
					memberList={this.props.memberList}
					name="seniorMentor"
				/>

				<Divider />

				<Label>Senior coach</Label>
				<MemberSelector
					memberList={this.props.memberList}
					name="seniorCoach"
				/>

				<Divider />

				<TextBox>
					Team visibility impacts how the members are viewed
					<br />
					Private means members have to sign in to see member names,
					but can only see contact information if they are part of the
					team
					<br />
					Protected means that the names and contact information
					require being signed in to see
					<br />
					Public means that people can see names and contact
					information
				</TextBox>

				<Label>Team visibility</Label>
				<SimpleRadioButton<TeamPublicity>
					labels={['Private', 'Protected', 'Public']}
					name="visibility"
					errorMessage="Please select a publicity"
				/>

				<Divider />

				<ListEditor<NewTeamMember, TeamMemberInputProps>
					name="members"
					addNew={() => ({
						reference: {
							type: 'Null'
						},
						job: ''
					})}
					extraProps={{
						memberList: this.props.memberList
					}}
					inputComponent={TeamMemberInput}
					fullWidth={true}
					buttonText="Add team member"
				/>

				<Divider />
			</SimpleForm>
		);
	}

	private onTeamChange(
		team: NewTeamObject,
		errors: BooleanFields<NewTeamObject>,
		changed: BooleanFields<NewTeamObject>,
		valid: boolean
	) {
		this.props.onTeamChange(team, valid);
	}

	private onTeamSubmit(
		team: NewTeamObject,
		errors: BooleanFields<NewTeamObject>,
		changed: BooleanFields<NewTeamObject>,
		valid: boolean
	) {
		this.props.onTeamFormSubmit(team, valid);
	}
}
