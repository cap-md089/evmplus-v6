import { Schema } from '@mysql/xdevapi';
import { TeamPublicity } from '../../../lib/index';
import Account from './Account';
import MemberBase from './MemberBase';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';

export default class Team implements TeamObject, DatabaseInterface<TeamObject> {
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

	public members: MemberReference[] = [];

	public cadetLeader: MemberReference | null;

	public seniorCoach: MemberReference | null;

	public seniorMentor: MemberReference | null;

	public visiblity: TeamPublicity;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private constructor(
		data: FullDBObject<TeamObject>,
		private account: Account,
		private schema: Schema
	) {
		this.set(data);
	}

	public set(values: Partial<TeamObject>) {
		const keys: Array<keyof TeamObject> = [
			'cadetLeader',
			'description',
			'id',
			'members',
			'name',
			'seniorCoach',
			'seniorMentor',
			'visiblity',
			'_id'
		];

		for (const i of keys) {
			if (typeof this[i] === typeof values[i] && i !== 'accountID') {
				this[i] = values[i];
			}
		}
	}

	public async save(): Promise<void> {
		const teamCollection = this.schema.getCollection<TeamObject>(
			Team.collectionName
		);

		await teamCollection.replaceOne(this._id, this.toFullRaw());
	}

	public async delete(): Promise<void> {
		const teamCollection = this.schema.getCollection<TeamObject>(
			Team.collectionName
		);

		await teamCollection.removeOne(this._id);
	}

	public toRaw = (member?: MemberBase): TeamObject => ({
		accountID: this.accountID,
		cadetLeader: this.cadetLeader,
		description: this.description,
		id: this.id,
		members:
			!member && this.visiblity !== TeamPublicity.PUBLIC
				? null
				: this.members,
		name: this.name,
		seniorCoach: this.seniorCoach,
		seniorMentor: this.seniorMentor,
		visiblity: this.visiblity
	});

	public toFullRaw = (): TeamObject => ({
		...this.toRaw(),
		members: this.members
	});
}
