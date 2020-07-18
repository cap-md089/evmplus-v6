import * as React from 'react';
import { InputProps } from './Input';
import { FormBlock, Label, MemberSelector, TextInput } from '../forms/SimpleForm';
import { Member } from 'common-lib';
import { NewTeamMemberEdit } from '../forms/usable-forms/TeamForm';

export interface TeamMemberInputProps extends InputProps<NewTeamMemberEdit> {
	memberList: Member[];
}

export default (props: TeamMemberInputProps) => (
	<FormBlock
		onUpdate={props.onUpdate}
		onInitialize={props.onInitialize}
		value={props.value}
		name={`teamMemberInput-${props.index}`}
	>
		<MemberSelector name="reference" memberList={props.memberList} />

		<Label>Job</Label>
		<TextInput name="job" />
	</FormBlock>
);
