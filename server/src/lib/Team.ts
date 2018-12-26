import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import { TeamPublicity } from '../../../lib/index';
import Account from './Account';
import MemberBase from './MemberBase';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';
import NewTeamMemberValidator from './validator/validators/NewTeamMember';
import NewTeamObjectValidator from './validator/validators/NewTeamObject';

export default class Team implements TeamObject, DatabaseInterface<TeamObject> {

	public static Validator = new NewTeamObjectValidator();
	public static MemberValidator = new NewTeamMemberValidator();

	public static async Get(
		id: number,
		account: Account,
		schema: Schema
	): Promise<Team> {
		const teamCollection = schema.getCollection<FullDBObject<TeamObject>>(
			this.collectionName
		);

		const results = await collectResults(
			findAndBind(teamCollection, {
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Cannot get team');
		}

		return new Team(results[0], account, schema);
	}

	public static async Create(
		data: NewTeamObject,
		account: Account,
		schema: Schema
	): Promise<Team> {
		const teamsCollection = schema.getCollection<TeamObject>(
			Team.collectionName
		);

		let results;

		results = await generateResults(
			findAndBind(teamsCollection, {
				accountID: account.id
			})
		);

		let id = 0;

		for await (const team of results) {
			id = Math.max(id, team.id);
		}

		// Make sure it's not just the biggest post ID, but the one after
		id++;

		const newTeam: TeamObject = {
			...data,
			id,
			accountID: account.id
		};

		// tslint:disable-next-line:variable-name
		const _id = (await teamsCollection
			.add(newTeam)
			.execute()).getGeneratedIds()[0];

		const fullNewTeam: FullDBObject<TeamObject> = {
			...newTeam,
			_id
		};

		return new Team(fullNewTeam, account, schema);
	}

	private static collectionName = 'Teams';

	public id: number;

	public get accountID() {
		return this.account.id;
	}

	public name: string;

	public description: string;

	public members: TeamMember[] = [];

	public cadetLeader: MemberReference | null;

	public seniorCoach: MemberReference | null;

	public seniorMentor: MemberReference | null;

	public visiblity: TeamPublicity;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private deleted = false;

	private constructor(
		data: FullDBObject<TeamObject>,
		private account: Account,
		private schema: Schema
	) {
		this.set(data);
		this.members = data.members;
	}

	public set(values: Partial<TeamObject>): boolean {
		if (Team.Validator.validate(values, true)) {
			Team.Validator.partialPrune(values, this);

			return true;
		} else {
			throw new Error(Team.Validator.getErrorString());
		}
	}

	public async save(): Promise<void> {
		if (this.deleted) {
			throw new Error('Cannot operate on a deleted event');
		}

		const teamCollection = this.schema.getCollection<TeamObject>(
			Team.collectionName
		);

		await teamCollection.replaceOne(this._id, this.toFullRaw());
	}

	public async delete(): Promise<void> {
		if (this.deleted) {
			throw new Error('Cannot operate on a deleted event');
		}

		const teamCollection = this.schema.getCollection<TeamObject>(
			Team.collectionName
		);

		await teamCollection.removeOne(this._id);

		this.deleted = true;
	}

	public toRaw = (member?: MemberBase): TeamObject => ({
		accountID: this.accountID,
		cadetLeader: this.cadetLeader,
		description: this.description,
		id: this.id,
		members:
			!!member || this.visiblity === TeamPublicity.PUBLIC
				? this.members
				: [],
		name: this.name,
		seniorCoach: this.seniorCoach,
		seniorMentor: this.seniorMentor,
		visiblity: this.visiblity
	});

	public toFullRaw = (): TeamObject => ({
		...this.toRaw(),
		members: this.members
	});

	public addTeamMember(member: MemberReference, job: string) {
		this.members.push({
			job,
			joined: +DateTime.utc(),
			reference: member
		});
	}

	public removeTeamMember(member: MemberReference) {
		this.members = this.members.filter(
			f => !MemberBase.AreMemberReferencesTheSame(member, f.reference)
		);
	}

	public modifyTeamMember(member: MemberReference, job: string) {
		let index;

		for (let i = 0; i < this.members.length; i++) {
			if (
				MemberBase.AreMemberReferencesTheSame(
					member,
					this.members[i].reference
				)
			) {
				index = i;

				break;
			}
		}

		this.members[index].job = job;
	}
}
