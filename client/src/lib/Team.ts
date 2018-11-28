import { DateTime } from 'luxon';
import { TeamPublicity } from '../enums';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './MemberBase';

export default class Team extends APIInterface<TeamObject>
	implements TeamObject {
	public static async Get(id: number, account: Account, member?: MemberBase) {
		let result;
		try {
			result = await account.fetch('/api/team/' + id, {}, member);
		} catch (e) {
			throw new Error('Could not get team');
		}

		const json = await result.json();

		return new Team(json, account);
	}

	public static async Create(
		data: NewTeamObject,
		member: MemberBase,
		account?: Account
	) {
		if (!member.hasPermission('AddTeam')) {
			throw new Error('Invalid permissions');
		}

		if (!account) {
			account = await Account.Get();
		}

		let result;
		try {
			result = await account.fetch(
				'/api/team',
				{
					headers: {
						'content-type': 'application/json'
					},
					body: JSON.stringify(data),
					method: 'POST'
				},
				member
			);
		} catch (e) {
			throw new Error('Could not create team');
		}

		const json = await result.json();

		return new Team(json, account);
	}

	public get accountID() {
		return this.account.id;
	}

	public cadetLeader: MemberReference | null;

	public description: string;

	public id: number;

	public members: TeamMember[];

	public name: string;

	public seniorCoach: MemberReference;

	public seniorMentor: MemberReference;

	public visiblity: TeamPublicity = TeamPublicity.PUBLIC;

	private account: Account;

	public constructor(obj: TeamObject, account: Account) {
		super(account.id);

		Object.assign(this, obj);
	}

	public async delete(member: MemberBase): Promise<void> {
		if (!member.hasPermission('EditTeam')) {
			throw new Error('Member does not have permissions to delete team');
		}

		try {
			await this.fetch(
				'/api/delete',
				{
					method: 'DELETE'
				},
				member
			);
		} catch (e) {
			throw new Error('Could not delete team');
		}
	}

	public async save(member: MemberBase): Promise<void> {
		if (!member.hasPermission('EditTeam')) {
			throw new Error('Member does not have permissions to modify team');
		}

		try {
			await this.fetch(
				'/api/team',
				{
					method: 'PUT',
					body: JSON.stringify(this.toRaw()),
					headers: {
						'content-type': 'application/json'
					}
				},
				member
			);
		} catch (e) {
			throw new Error('Could not save team information');
		}
	}

	public toRaw(): TeamObject {
		return {
			accountID: this.accountID,
			cadetLeader: this.cadetLeader,
			description: this.description,
			id: this.id,
			members: this.members,
			name: this.name,
			seniorCoach: this.seniorCoach,
			seniorMentor: this.seniorMentor,
			visiblity: this.visiblity
		};
	}

	public async addTeamMember(
		member: MemberBase,
		memberToAdd: MemberBase,
		job: string
	): Promise<void> {
		if (!member.hasPermission('EditTeam')) {
			throw new Error('Member does not have permissions to modify team');
		}

		const teamMember: TeamMember = {
			reference: memberToAdd.getReference(),
			job,
			joined: +DateTime.utc()
		};

		this.members.push(teamMember);

		await this.fetch(
			`/api/team/${this.id}/members`,
			{
				method: 'POST',
				body: JSON.stringify(teamMember)
			},
			member
		);
	}

	public async removeMember(member: MemberBase, memberToAdd: MemberBase) {
		if (!member.hasPermission('EditTeam')) {
			throw new Error('Member does not have permission to modify team');
		}

		this.members = this.members.filter(
			f =>
				!MemberBase.AreMemberReferencesTheSame(
					memberToAdd.getReference(),
					f.reference
				)
		);

		const teamMember: TeamMember = {
			reference: memberToAdd.getReference(),
			job: '',
			joined: +DateTime.utc()
		};

		await this.fetch(
			`/api/team/${this.id}/members`,
			{
				method: 'DELETE',
				body: JSON.stringify(teamMember)
			},
			member
		);
	}
}
