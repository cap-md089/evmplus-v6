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

import * as React from 'react';
import Button from '../Button';
import { TextInput } from '../forms/SimpleForm';
import Loader from '../Loader';
import LoaderShort from '../LoaderShort';
import { DialogueButtonProps } from './DialogueButton';
import DownloadDialogue from './DownloadDialogue';
import { Member, getFullMemberName } from 'common-lib';
import { CheckInput } from '../form-inputs/Selector';

type MemberSelectorButtonProps = DialogueButtonProps & {
	memberList: Promise<Member[]> | Member[];
	onMemberSelect: (member: Member | null) => void;
	useShortLoader?: boolean;
	disabled?: boolean;
	buttonType?: '' | 'primaryButton' | 'secondaryButton' | 'none';
};

interface MemberSelectorButtonState {
	members: Member[] | null;
	open: boolean;
	selectedValue: Member | null;
	filterValues: [string];
}

export default class MemberSelectorButton extends React.Component<
	MemberSelectorButtonProps,
	MemberSelectorButtonState
> {
	public state: MemberSelectorButtonState = {
		members: null,
		open: false,
		selectedValue: null,
		filterValues: [''],
	};

	public async componentDidMount(): Promise<void> {
		const members = await this.props.memberList;

		this.setState({
			members,
		});
	}

	public render(): JSX.Element {
		if (!this.state.members) {
			return this.props.useShortLoader ? <LoaderShort /> : <Loader />;
		}

		return (
			<>
				<Button
					buttonType={this.props.buttonType}
					onClick={this.openDialogue}
					disabled={this.props.disabled}
				>
					{this.props.children}
				</Button>
				<DownloadDialogue<Member, [string]>
					open={this.state.open}
					multiple={false}
					overflow={400}
					title="Select a member"
					showIDField={false}
					displayValue={getFullMemberName}
					onCancel={() => this.selectMember(null)}
					valuePromise={this.state.members}
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
			</>
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

		this.props.onMemberSelect(selectedValue);
	};
}
