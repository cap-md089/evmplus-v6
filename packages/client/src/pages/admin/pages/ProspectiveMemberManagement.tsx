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
	CAPProspectiveMemberObject,
	Either,
	hasPermission,
	Maybe,
	MaybeObj,
	getFullMemberName,
	CAPNHQMemberObject,
	CAPMember,
	stringifyMemberReference,
	complement,
	areMembersTheSame,
	toReference,
	Permissions,
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import Loader from '../../../components/Loader';
import Button from '../../../components/Button';
import Dialogue, { DialogueButtons } from '../../../components/dialogues/Dialogue';
import DownloadDialogue from '../../../components/dialogues/DownloadDialogue';
import { TextInput } from '../../../components/forms/SimpleForm';

interface ProspectiveMemberManagementLoadingState {
	state: 'LOADING';
}

interface ProspectiveMemberManagementErrorState {
	state: 'ERROR';

	errorMessage: string;
}

interface ProspectiveMemberManagementLoadedState {
	state: 'LOADED';

	members: CAPMember[];
}

interface ProspectiveMemberManagementUIState {
	upgradeMemberTarget: MaybeObj<CAPProspectiveMemberObject>;
	deleteMemberTarget: MaybeObj<CAPProspectiveMemberObject>;
	upgradeMemberFilterValues: any[];
	selectedUpgradeMember: CAPNHQMemberObject | null;
}

type ProspectiveMemberManagementState = ProspectiveMemberManagementUIState &
	(
		| ProspectiveMemberManagementLoadingState
		| ProspectiveMemberManagementLoadedState
		| ProspectiveMemberManagementErrorState
	);

export default class ProspectiveMemberManagement extends Page<
	PageProps,
	ProspectiveMemberManagementState
> {
	public state: ProspectiveMemberManagementState = {
		state: 'LOADING',
		upgradeMemberTarget: Maybe.none(),
		deleteMemberTarget: Maybe.none(),
		upgradeMemberFilterValues: [''],
		selectedUpgradeMember: null,
	};

	constructor(props: PageProps) {
		super(props);

		this.startDeleteMember = this.startDeleteMember.bind(this);
		this.startUpgradeMember = this.startUpgradeMember.bind(this);

		this.upgradeMember = this.upgradeMember.bind(this);
		this.deleteMember = this.deleteMember.bind(this);

		this.cancelDeleteMember = this.cancelDeleteMember.bind(this);
		this.cancelUpgradeMember = this.cancelUpgradeMember.bind(this);

		this.updateFilterValues = this.updateFilterValues.bind(this);

		this.selectUpgradeMember = this.selectUpgradeMember.bind(this);
	}

	public async componentDidMount() {
		this.updateTitle('Prospective Member Management');
		this.props.updateSideNav([]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/prospectivemembermanagement',
				text: 'Prospective Member Management',
			},
		]);

		if (
			this.props.member &&
			hasPermission('ProspectiveMemberManagement')(
				Permissions.ProspectiveMemberManagement.FULL,
			)(this.props.member)
		) {
			const memberEither = await fetchApi.member.memberList(
				{},
				{},
				this.props.member.sessionID,
			);

			if (Either.isLeft(memberEither)) {
				this.setState(prev => ({
					...prev,

					state: 'ERROR',
					errorMessage: memberEither.value.message,
				}));
			} else {
				this.setState(prev => ({
					...prev,

					state: 'LOADED',
					members: memberEither.value,
				}));

				this.props.updateSideNav(
					memberEither.value
						.filter(rec => rec.type === 'CAPProspectiveMember')
						.map(rec => ({
							target: stringifyMemberReference(rec),
							text: getFullMemberName(rec),
							type: 'Reference',
						})),
				);
			}
		}
	}

	public render() {
		if (
			!this.props.member ||
			!hasPermission('ProspectiveMemberManagement')(
				Permissions.ProspectiveMemberManagement.FULL,
			)(this.props.member)
		) {
			return <div>You do not have permission to access this page</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.errorMessage}</div>;
		}

		return (
			<>
				{Maybe.isSome(this.state.upgradeMemberTarget) ? null : null}
				<DownloadDialogue<CAPNHQMemberObject>
					open={Maybe.isSome(this.state.upgradeMemberTarget)}
					multiple={false}
					overflow={400}
					onCancel={this.cancelUpgradeMember}
					title="Select new member"
					showIDField={false}
					displayValue={getFullMemberName}
					valuePromise={this.state.members.filter(
						(mem): mem is CAPNHQMemberObject => mem.type === 'CAPNHQMember',
					)}
					filters={[
						{
							check(memberToCheck, input) {
								if (input === '' || typeof input !== 'string') {
									return true;
								}

								try {
									return !!getFullMemberName(memberToCheck).match(
										new RegExp(input, 'gi'),
									);
								} catch (e) {
									return false;
								}
							},
							displayText: 'Member name',
							filterInput: TextInput,
						},
					]}
					filterValues={this.state.upgradeMemberFilterValues}
					onFilterValuesChange={this.updateFilterValues}
					onValueSelect={this.upgradeMember}
					onValueClick={this.selectUpgradeMember}
					selectedValue={this.state.selectedUpgradeMember}
				/>
				<Dialogue
					displayButtons={DialogueButtons.OK_CANCEL}
					onCancel={this.cancelDeleteMember}
					onClose={this.cancelDeleteMember}
					onOk={this.deleteMember}
					open={Maybe.isSome(this.state.deleteMemberTarget)}
					title="Delete prospective member"
				>
					Really delete member?
				</Dialogue>
				<ul>
					{this.state.members
						.filter(
							(mem): mem is CAPProspectiveMemberObject =>
								mem.type === 'CAPProspectiveMember',
						)
						.map((member, i) => (
							<li key={i} id={stringifyMemberReference(member)}>
								{getFullMemberName(member)}
								<br />
								<Button
									data={member}
									useData={true}
									onClick={this.startUpgradeMember}
									buttonType="none"
								>
									Replace member
								</Button>
								<br />
								<Button
									data={member}
									useData={true}
									onClick={this.startDeleteMember}
									buttonType="none"
								>
									Delete member
								</Button>
							</li>
						))}
				</ul>
			</>
		);
	}

	private startDeleteMember(member: CAPProspectiveMemberObject) {
		this.setState({
			deleteMemberTarget: Maybe.some(member),
		});
	}

	private startUpgradeMember(member: CAPProspectiveMemberObject) {
		this.setState({
			upgradeMemberTarget: Maybe.some(member),
		});
	}

	private cancelDeleteMember() {
		this.setState({
			upgradeMemberTarget: Maybe.none(),
		});
	}

	private cancelUpgradeMember() {
		this.setState({
			upgradeMemberTarget: Maybe.none(),
		});
	}

	private async upgradeMember(targetMember: CAPNHQMemberObject | null) {
		if (!targetMember || Maybe.isNone(this.state.upgradeMemberTarget) || !this.props.member) {
			return;
		}

		const memberTarget = this.state.upgradeMemberTarget.value;

		await fetchApi.member.account.capprospective
			.upgradeProspectiveAccount(
				{ account: stringifyMemberReference(memberTarget) },
				{ nhqReference: toReference(targetMember) },
				this.props.member.sessionID,
			)
			.fullJoin();

		this.setState(prev =>
			prev.state === 'LOADED'
				? {
						...prev,

						state: 'LOADED',
						members: prev.members.filter(complement(areMembersTheSame(memberTarget))),
						upgradeMemberTarget: Maybe.none(),
				  }
				: prev,
		);
	}

	private async deleteMember() {
		if (Maybe.isNone(this.state.deleteMemberTarget) || !this.props.member) {
			return;
		}

		const memberTarget = this.state.deleteMemberTarget.value;

		await fetchApi.member.account.capprospective
			.deleteProspectiveAccount(
				{ account: stringifyMemberReference(memberTarget) },
				{},
				this.props.member.sessionID,
			)
			.fullJoin();

		this.setState(prev =>
			prev.state === 'LOADED'
				? {
						...prev,

						state: 'LOADED',
						members: prev.members.filter(complement(areMembersTheSame(memberTarget))),
						deleteMemberTarget: Maybe.none(),
				  }
				: prev,
		);
	}

	private updateFilterValues(filterValues: any[]) {
		this.setState({
			upgradeMemberFilterValues: filterValues,
		});
	}

	private selectUpgradeMember(member: CAPNHQMemberObject | null) {
		this.setState({
			selectedUpgradeMember: member,
		});
	}
}
