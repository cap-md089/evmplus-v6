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

import {
	areMembersTheSame,
	DisplayInternalPointOfContact,
	ExternalPointOfContact,
	getFullMemberName,
	getMemberEmail,
	getMemberPhone,
	Identifiable,
	InternalPointOfContact,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	PointOfContact,
	PointOfContactType,
	toReference,
} from 'common-lib';
import * as React from 'react';
import Button from '../Button';
import DownloadDialogue from '../dialogues/DownloadDialogue';
import { DisabledText, FormBlock, Label, TextInput } from '../forms/SimpleForm';
import EnumRadioButton from './EnumRadioButton';
import { NotOptionalInputProps } from './Input';
import TextBox from './TextBox';

const isInternalPOC = (poc: PointOfContact): poc is InternalPointOfContactEdit & { name: string } =>
	poc.type === PointOfContactType.INTERNAL;

export interface InternalPointOfContactEdit
	extends Omit<DisplayInternalPointOfContact, 'name' | 'memberReference'> {
	memberReference: MaybeObj<MemberReference>;
}

export const upgradeDisplayInternalPointOfContactToEdit = (
	poc: DisplayInternalPointOfContact,
): InternalPointOfContactEdit => ({
	email: poc.email,
	memberReference: Maybe.some(poc.memberReference),
	phone: poc.phone,
	position: poc.position,
	receiveEventUpdates: poc.receiveEventUpdates,
	receiveRoster: poc.receiveRoster,
	receiveSignUpUpdates: poc.receiveSignUpUpdates,
	receiveUpdates: poc.receiveUpdates,
	type: PointOfContactType.INTERNAL,
});

export const simplifyDisplayInternalPointOfContactFromEdit = (
	poc: InternalPointOfContactEdit,
): MaybeObj<InternalPointOfContact> =>
	Maybe.map<MemberReference, InternalPointOfContact>(memberReference => ({
		email: poc.email,
		memberReference,
		phone: poc.phone,
		position: poc.position,
		receiveEventUpdates: poc.receiveEventUpdates,
		receiveRoster: poc.receiveRoster,
		receiveSignUpUpdates: poc.receiveSignUpUpdates,
		receiveUpdates: poc.receiveUpdates,
		type: PointOfContactType.INTERNAL,
	}))(poc.memberReference);

export interface POCInputProps
	extends NotOptionalInputProps<InternalPointOfContactEdit | ExternalPointOfContact> {
	memberList: Member[];
}

export default class POCInput extends React.Component<
	POCInputProps,
	{
		memberSelectOpen: boolean;
		filterValues: [string];
		selectedValue: null | Member;
	}
> {
	public state = {
		memberSelectOpen: false,
		filterValues: [''] as [string],
		selectedValue: null,
	};

	public constructor(props: POCInputProps) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: this.props.value || {
					type: PointOfContactType.INTERNAL,
					email: '',
					memberReference: Maybe.none(),
					phone: '',
					position: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false,
				},
			});
		}

		this.onUpdate = this.onUpdate.bind(this);
		this.onMemberSelectClick = this.onMemberSelectClick.bind(this);
		this.updateFilterValues = this.updateFilterValues.bind(this);
		this.selectMember = this.selectMember.bind(this);
		this.setSelectedValue = this.setSelectedValue.bind(this);
	}

	public render(): JSX.Element {
		if (!this.props.value) {
			throw new Error('Value required');
		}

		if (!this.props.member) {
			throw new Error('Member required');
		}

		if (!this.props.account) {
			throw new Error('Account required');
		}

		const value = {
			...this.props.value,
			name:
				this.props.value.type === PointOfContactType.INTERNAL
					? Maybe.orSome('')(
							Maybe.map(getFullMemberName)(
								Maybe.flatMap<MemberReference, Member>(member =>
									Maybe.fromArray(
										this.props.memberList.filter(areMembersTheSame(member)),
									),
								)(this.props.value.memberReference),
							),
					  )
					: this.props.value.name,
		};

		return (
			<FormBlock<InternalPointOfContactEdit | ExternalPointOfContact>
				name={`pocInput-${this.props.index ?? 0}`}
				onFormChange={this.onUpdate}
				onInitialize={this.props.onInitialize}
				value={value}
			>
				<Label>POC Type</Label>
				<EnumRadioButton
					name="type"
					labels={['Internal', 'External']}
					index={this.props.index}
					values={[PointOfContactType.INTERNAL, PointOfContactType.EXTERNAL]}
					defaultValue={PointOfContactType.INTERNAL}
					key="type"
				/>

				{this.getMemberSelector()}

				{this.getIDViewer()}

				<Label>Name</Label>
				<TextInput key="name" name="name" disabled={isInternalPOC(value)} />

				<Label>POC Email</Label>
				<TextInput key="email" name="email" />

				<Label>POC Phone</Label>
				<TextInput name="phone" />

				<Label>Position</Label>
				<TextInput name="position" />

				{/* <Label>Receive event updates</Label>
				<Checkbox name="receiveEventUpdates" index={this.props.index} />

				<Label>Receive roster</Label>
				<Checkbox name="receiveRoster" index={this.props.index} />

				<Label>Receive signup updates</Label>
				<Checkbox name="receiveSignUpUpdates" index={this.props.index} />

				<Label>Receive updates</Label>
				<Checkbox name="receiveUpdates" index={this.props.index} />

				<Label>Show contact info to public</Label>
				<Checkbox name="publicDisplay" index={this.props.index} /> */}
			</FormBlock>
		);
	}

	private onUpdate = (
		poc: InternalPointOfContactEdit | ExternalPointOfContact,
		error: any,
		changed: any,
		hasError: any,
		name: keyof (InternalPointOfContactEdit | ExternalPointOfContact),
	): void => {
		if (name === 'type') {
			if (poc.type === PointOfContactType.INTERNAL) {
				poc = {
					type: PointOfContactType.INTERNAL,
					email: '',
					memberReference: Maybe.none(),
					phone: '',
					position: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false,
				};
			} else {
				poc = {
					type: PointOfContactType.EXTERNAL,
					email: '',
					name: '',
					phone: '',
					position: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false,
				};
			}
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: `pocInput-${this.props.index ?? 0}`,
				value: poc,
			});
		}
	};

	private onMemberSelectClick = (): void => {
		this.setState({
			memberSelectOpen: true,
		});
	};

	private updateFilterValues = (filterValues: [string]): void => {
		this.setState({ filterValues });
	};

	private selectMember = (member: Member | null): void => {
		if (member !== null) {
			const value: InternalPointOfContactEdit = {
				...(this.props.value as InternalPointOfContactEdit),
				email: Maybe.orSome('')(getMemberEmail(member.contact)),
				memberReference: Maybe.some(toReference(member)),
				phone: Maybe.orSome('')(getMemberPhone(member.contact)),
			};

			this.onUpdate(value, null, null, null, 'email');
		}

		this.setState({
			memberSelectOpen: false,
		});
	};

	private setSelectedValue = (selectedValue: Member | null): void => {
		this.setState({
			selectedValue,
		});
	};

	private getIDViewer(): JSX.Element | null {
		const value = this.props.value;

		if (!value || value.type !== PointOfContactType.INTERNAL) {
			return null;
		}

		return isInternalPOC(value) ? (
			<FormBlock
				name="memberReference"
				value={Maybe.orSome<Identifiable>({ id: '' })(value.memberReference)}
			>
				<Label>ID</Label>
				<DisabledText name="id" />
			</FormBlock>
		) : null;
	}

	private getMemberSelector(): JSX.Element | null {
		const MemberDialogue = DownloadDialogue as new () => DownloadDialogue<Member, [string]>;

		return this.props.value && isInternalPOC(this.props.value) ? (
			<TextBox>
				<Button onClick={this.onMemberSelectClick}>Select a member</Button>
				<MemberDialogue
					open={this.state.memberSelectOpen}
					multiple={false}
					overflow={400}
					onCancel={() => this.selectMember(null)}
					title="Select Point of Contact"
					showIDField={false}
					displayValue={getFullMemberName}
					valuePromise={this.props.memberList}
					filters={[
						{
							check: (memberToCheck, input) => {
								if (input === '' || typeof input !== 'string') {
									return true;
								}

								try {
									return !!new RegExp(input, 'gi').exec(
										getFullMemberName(memberToCheck),
									);
								} catch (e) {
									return false;
								}
							},
							displayText: 'Member name',
							filterInput: TextInput,
						},
					]}
					filterValues={this.state.filterValues}
					onFilterValuesChange={this.updateFilterValues}
					onValueClick={this.setSelectedValue}
					onValueSelect={this.selectMember}
					selectedValue={this.state.selectedValue}
				/>
			</TextBox>
		) : null;
	}
}
