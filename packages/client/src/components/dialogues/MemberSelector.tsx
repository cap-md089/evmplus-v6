/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import Button from '../Button';
import DownloadDialogue from './DownloadDialogue';
import { FormBlock, Label, TextBox, TextInput } from '../forms/SimpleForm';
import { InputProps } from '../form-inputs/Input';
import {
	MemberReference,
	Maybe as M,
	Member,
	MaybeObj,
	getFullMemberName,
	toReference,
	areMembersTheSame,
} from 'common-lib';
import { CheckInput } from '../form-inputs/Selector';

interface MemberInputProps extends InputProps<MaybeObj<MemberReference>> {
	memberList: Member[];
}

interface MemberInputState {
	open: boolean;
	selectedValue: Member | null;
	filterValues: [string];
}

export default class MemberSelector extends React.Component<MemberInputProps, MemberInputState> {
	public state: MemberInputState = {
		open: false,
		selectedValue: null,
		filterValues: [''],
	};

	public render(): JSX.Element {
		const memberRef: MaybeObj<MemberReference> = this.props.value ?? M.none();

		const targetMember = memberRef.hasValue
			? this.props.memberList.filter(areMembersTheSame(memberRef.value))[0]
			: null;

		return (
			<FormBlock name={this.props.name}>
				<Label />

				<TextBox>
					<Button onClick={this.openDialogue}>Select a member</Button>
					<DownloadDialogue<Member, [string]>
						open={this.state.open}
						multiple={false}
						overflow={400}
						title="Select a member"
						showIDField={false}
						displayValue={getFullMemberName}
						valuePromise={this.props.memberList}
						onCancel={() => this.selectMember(null)}
						filters={
							[
								{
									check: (member, input) => {
										if (input === '' || typeof input !== 'string') {
											return true;
										}

										try {
											return !!new RegExp(input, 'gi').exec(
												getFullMemberName(member),
											);
										} catch (e) {
											return false;
										}
									},
									displayText: 'Member name',
									filterInput: TextInput,
								} as CheckInput<Member, string>,
							] as const
						}
						onValueClick={this.setSelectedMember}
						onValueSelect={this.selectMember}
						selectedValue={this.state.selectedValue}
						filterValues={this.state.filterValues}
					/>
				</TextBox>

				<Label>Member ID</Label>
				<TextInput
					disabled={true}
					name="id"
					value={targetMember ? targetMember.id.toString() : ''}
				/>

				<Label>Member name</Label>
				<TextInput
					disabled={true}
					name="name"
					value={targetMember ? getFullMemberName(targetMember) : ''}
				/>
			</FormBlock>
		);
	}

	private openDialogue = (): void => {
		this.setState({
			open: true,
		});
	};

	private setSelectedMember = (selectedValue: Member | null): void => {
		this.setState({
			selectedValue,
		});
	};

	private selectMember = (selectedValue: Member | null): void => {
		this.setState({
			selectedValue,
			open: false,
		});

		const value: MaybeObj<MemberReference> = M.map(toReference)(M.fromValue(selectedValue));

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value,
			});
		}
	};
}
