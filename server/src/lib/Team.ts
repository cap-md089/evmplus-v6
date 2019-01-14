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
		id: number | string,
		account: Account,
		schema: Schema
	): Promise<Team> {
		id = parseInt(id.toString(), 10);
		// Team 0 is reserved for the cadet staff
		if (id === 0) {
			return Team.GetStaffTeam(account, schema);
		}

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

		return new Team(results[0], schema);
	}

	public static async GetStaffTeam(
		account: Account,
		schema: Schema
	): Promise<Team> {
		const cadetDutyPositions = schema.getCollection<NHQ.CadetDutyPosition>(
			'NHQ_CadetDutyPosition'
		);
		const dutyPositions = schema.getCollection<NHQ.DutyPosition>(
			'NHQ_DutyPosition'
		);

		const teamObject: TeamObject = {
			accountID: account.id,
			cadetLeader: {
				type: 'Null'
			},
			description: 'Cadet Staff for this account',
			id: 0,
			members: [],
			name: 'Cadet Staff',
			seniorCoach: {
				type: 'Null'
			},
			seniorMentor: {
				type: 'Null'
			},
			teamHistory: [],
			visiblity: TeamPublicity.PUBLIC
		};

		const cadetGenerator = generateResults(
			findAndBind(cadetDutyPositions, {
				ORGID: account.mainOrg
			})
		);

		const cadets: {
			[key: number]: {
				positions: string[];
				joined: number;
			};
		} = {};

		for await (const cadetDutyPosition of cadetGenerator) {
			if (cadetDutyPosition.Duty === 'Cadet Commander') {
				teamObject.cadetLeader = {
					type: 'CAPNHQMember',
					id: cadetDutyPosition.CAPID
				};
			}

			if (!cadets[cadetDutyPosition.CAPID]) {
				cadets[cadetDutyPosition.CAPID] = {
					positions: [cadetDutyPosition.Duty],
					joined: +DateTime.fromISO(cadetDutyPosition.DateMod)
				};
			} else {
				const cadet = cadets[cadetDutyPosition.CAPID];

				cadet.positions.push(cadetDutyPosition.Duty);
				cadet.joined = Math.min(
					cadet.joined,
					+DateTime.fromISO(cadetDutyPosition.DateMod)
				);
			}
		}

		for (const cadet in cadets) {
			if (cadets.hasOwnProperty(cadet)) {
				teamObject.members.push({
					job: cadets[cadet].positions.join(', '),
					joined: cadets[cadet].joined,
					reference: {
						type: 'CAPNHQMember',
						id: parseInt(cadet, 10)
					}
				});
			}
		}

		const deputyCommanderDutyPositionGenerator = generateResults(
			findAndBind(dutyPositions, {
				Duty: 'Deputy Commander for Cadets',
				ORGID: account.mainOrg
			})
		);

		for await (const senior of deputyCommanderDutyPositionGenerator) {
			if (senior.Asst === 0 && senior.Duty === 'Deputy Commander for Cadets') {
				teamObject.seniorMentor = {
					type: 'CAPNHQMember',
					id: senior.CAPID
				};
			}
		}

		return new Team(
			{
				...teamObject,
				_id: ''
			},
			schema
		);
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

		// Make sure it's not just the biggest team ID, but the one after
		id++;

		const newTeam: TeamObject = {
			...data,
			id,
			teamHistory: [],
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

		return new Team(fullNewTeam, schema);
	}

	private static collectionName = 'Teams';

	public id: number;

	public accountID: string;

	public name: string;

	public description: string;

	public members: TeamMember[] = [];

	public cadetLeader: MemberReference | null;

	public seniorCoach: MemberReference | null;

	public seniorMentor: MemberReference | null;

	public visiblity: TeamPublicity;

	public teamHistory: PreviousTeamMember[] = [];

	// tslint:disable-next-line:variable-name
	public _id: string;

	private deleted = false;

	private constructor(
		data: FullDBObject<TeamObject>,
		private schema: Schema
	) {
		this.id = data.id;
		this.members = data.members;
		this.teamHistory = data.teamHistory;

		this.set(data);
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

		if (this.id === 0) {
			throw new Error('Cannot operate on a dynamic team');
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

		if (this.id === 0) {
			throw new Error('Cannot operate on a dynamic team');
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
		visiblity: this.visiblity,
		teamHistory:
			!!member || this.visiblity === TeamPublicity.PUBLIC
				? this.teamHistory
				: []
	});

	public toFullRaw = (): TeamObject => ({
		...this.toRaw(),
		members: this.members,
		teamHistory: this.teamHistory
	});

	public addTeamMember(member: MemberReference, job: string) {
		// TODO: Change Extra Member Information to add team ID
		this.members.push({
			job,
			joined: +DateTime.utc(),
			reference: member
		});
	}

	public removeTeamMember(member: MemberReference) {
		// TODO: Change Extra Member Information to remove team ID
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
