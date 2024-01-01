/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
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

import { Either, isRioux, Member, toReference, ChangeLogItem } from 'common-lib';
import React from 'react';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import DialogueButtonForm from '../../../components/dialogues/DialogueButtonForm';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import TextBox from '../../../components/form-inputs/TextBox';
import { DateTimeInput, Label, TextInput } from '../../../components/forms/SimpleForm';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface SuLoadingState {
	state: 'LOADING';
}

interface SuLoadedState {
	state: 'LOADED';

	members: Member[];
}

interface SuErrorState {
	state: 'ERROR';

	message: string;
}

type SuState = SuLoadedState | SuLoadingState | SuErrorState;

export const canUseSu = (props: PageProps): boolean => !!props.member && isRioux(props.member);

export default class SuWidget extends Page<PageProps, SuState> {
	public state: SuState = {
		state: 'LOADING',
	};

	public constructor(props: PageProps) {
		super(props);

		this.suMember = this.suMember.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		if (!this.props.member) {
			return;
		}

		const members = await fetchApi.member.memberList({}, {});

		if (members.direction === 'left') {
			this.setState({
				state: 'ERROR',
				message: members.value.message,
			});
		} else {
			this.setState({
				state: 'LOADED',
				members: members.value,
			});
		}
	}

	public render = (): JSX.Element => (
		<div className="widget">
			<div className="widget-title">Su</div>
			<div className="widget-body">
				{this.state.state === 'LOADING' ? (
					<LoaderShort />
				) : this.state.state === 'ERROR' ? (
					<div>{this.state.message}</div>
				) : (
					<div>
						There are {this.state.members.length} members in your unit
						<br />
						<br />
						<MemberSelectorButton
							useShortLoader={true}
							memberList={Promise.resolve(this.state.members)}
							title="Select member"
							displayButtons={DialogueButtons.OK_CANCEL}
							labels={['Select', 'Cancel']}
							onMemberSelect={this.suMember}
							buttonType="none"
						>
							Select a member
						</MemberSelectorButton>
						<br />
						<br />
						<DialogueButtonForm<ChangeLogItem>
							buttonText="Add release note/change log"
							buttonClass="underline-button"
							buttonType="none"
							displayButtons={DialogueButtons.OK_CANCEL}
							onOk={this.addNote}
							title="Add release note"
							labels={['Add note', 'Cancel']}
							values={{
								entryDateTime: Date.now(),
								entryCAPID: !!this.props.member ? +this.props.member.id : 0,
								noteDateTime: Date.now(),
								noteTitle: 'Enter title',
								noteText: 'Enter changelog item here',
							}}
						>
							<TextBox name="null">
								<span
									style={{
										lineHeight: '1px',
									}}
								>
									Add your title in the text box. This will be an H1 title with
									the date.
								</span>
							</TextBox>

							<TextInput name="noteTitle" />

							<TextBox name="null">
								<span
									style={{
										lineHeight: '1px',
									}}
								>
									Add your relase note in the text box. Markdown formatting is
									supported. Use '\n' to force a new line.
								</span>
							</TextBox>

							<TextInput name="noteText" />

							{/* <Label>Copy files to new event</Label>
								<Checkbox name="copyFiles" /> */}

							<Label>Change log date</Label>
							<DateTimeInput
								name="noteDateTime"
								time={true}
								originalTimeZoneOffset={'America/New_York'}
							/>
						</DialogueButtonForm>
					</div>
				)}
			</div>
		</div>
	);

	private suMember = async (member: Member | null): Promise<void> => {
		if (!member || !this.props.member) {
			return;
		}

		const newMember = await fetchApi.member.session
			.su({}, toReference(member))
			.flatMap(() => fetchApi.check({}, {}));

		if (Either.isLeft(newMember)) {
			this.setState({
				state: 'ERROR',
				message: newMember.value.message,
			});
		} else {
			this.props.authorizeUser(newMember.value);
		}
	};

	private addNote = async ({
		entryDateTime,
		entryCAPID,
		noteDateTime,
		noteTitle,
		noteText,
	}: ChangeLogItem): Promise<void> => {
		const mem = this.props.member;
		if (!mem) {
			return;
		}

		await fetchApi.changelog.add(
			{},
			{
				entryDateTime,
				entryCAPID,
				noteDateTime,
				noteTitle,
				noteText,
			},
		);
	};
}
