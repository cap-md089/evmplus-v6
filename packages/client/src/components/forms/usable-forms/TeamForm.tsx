/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	get,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	NewTeamMember,
	NewTeamObject,
	TeamPublicity
} from 'common-lib';
import * as React from 'react';
import MemberSelector from '../../dialogues/MemberSelector';
import TeamMemberInput, { TeamMemberInputProps } from '../../form-inputs/TeamMemberInput';
import SimpleForm, {
	BigTextBox,
	BooleanFields,
	Divider,
	FormValidator,
	Label,
	ListEditor,
	SimpleRadioButton,
	TextBox,
	TextInput
} from '../SimpleForm';

export interface NewTeamMemberEdit {
	reference: MaybeObj<MemberReference>;
	job: string;
}

export interface TeamObjectEdit extends Omit<NewTeamObject, 'members'> {
	members: NewTeamMemberEdit[];
}

interface TeamFormProps {
	team: TeamObjectEdit;
	isTeamUpdate?: boolean;
	memberList: Member[];
	onTeamChange: (event: TeamObjectEdit) => void;
	onTeamFormSubmit: (event: MaybeObj<TeamObjectEdit>) => void;
}

export const collapseTeamEditToObject = (team: TeamObjectEdit): MaybeObj<NewTeamObject> =>
	Maybe.map<NewTeamMember[], NewTeamObject>(members => ({ ...team, members }))(
		Maybe.And<NewTeamMember>(
			team.members.map(member =>
				Maybe.map<MemberReference, NewTeamMember>(reference => ({
					reference,
					job: member.job
				}))(member.reference)
			)
		)
	);

export const expandTeamObjectToEdit = (team: NewTeamObject): TeamObjectEdit => ({
	...team,
	members: team.members.map(({ reference, job }) => ({ reference: Maybe.some(reference), job }))
});

const teamValidator: FormValidator<TeamObjectEdit> = {
	name: name => name !== '',
	members: members => !members.map(get('reference')).some(Maybe.isNone)
};

export default class TeamForm extends React.Component<TeamFormProps> {
	public constructor(props: TeamFormProps) {
		super(props);

		this.onTeamChange = this.onTeamChange.bind(this);
		this.onTeamSubmit = this.onTeamSubmit.bind(this);
	}

	public render() {
		return (
			<SimpleForm<TeamObjectEdit>
				onChange={this.onTeamChange}
				onSubmit={this.onTeamSubmit}
				submitInfo={{
					text: this.props.isTeamUpdate ? 'Update team' : 'Create team'
				}}
				disableOnInvalid={true}
				values={this.props.team}
				validator={teamValidator}
			>
				<Label>Team name</Label>
				<TextInput name="name" errorMessage="Team name must not be empty" />

				<Label>Team description</Label>
				<BigTextBox name="description" />

				<Label>Cadet team leader</Label>
				<MemberSelector memberList={this.props.memberList} name="cadetLeader" />

				<Divider />

				<Label>Senior mentor</Label>
				<MemberSelector memberList={this.props.memberList} name="seniorMentor" />

				<Divider />

				<Label>Senior coach</Label>
				<MemberSelector memberList={this.props.memberList} name="seniorCoach" />

				<Divider />

				<TextBox>
					Team visibility impacts how the members are viewed
					<br />
					Private means members have to sign in to see member names, but can only see
					contact information if they are part of the team
					<br />
					Protected means that the names and contact information require being signed in
					to see
					<br />
					Public means that anyone can see names and contact information
				</TextBox>

				<Label>Team visibility</Label>
				<SimpleRadioButton<TeamPublicity>
					labels={['Private', 'Protected', 'Public']}
					name="visibility"
					errorMessage="Please select a publicity"
				/>

				<Divider />

				<ListEditor<NewTeamMemberEdit, TeamMemberInputProps>
					name="members"
					addNew={() => ({
						reference: Maybe.none(),
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

	private onTeamChange(team: TeamObjectEdit) {
		this.props.onTeamChange(team);
	}

	private onTeamSubmit(
		team: TeamObjectEdit,
		errors: BooleanFields<TeamObjectEdit>,
		changed: BooleanFields<TeamObjectEdit>,
		hasError: boolean
	) {
		this.props.onTeamFormSubmit(hasError ? Maybe.none() : Maybe.some(team));
	}
}
