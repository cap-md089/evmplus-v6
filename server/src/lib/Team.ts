import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import { TeamPublicity } from '../../../lib/index';
import Account from './Account';
import MemberBase from './MemberBase';
import { collectResults, findAndBind, generateResults } from './MySQLUtil';
import NewTeamMemberValidator from './validator/validators/NewTeamMember';
import NewTeamObjectValidator from './validator/validators/NewTeamObject';

export default class Team implements FullTeamObject {
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

		const teamCollection = schema.getCollection<
			FullDBObject<RawTeamObject>
		>(this.collectionName);

		const results = await collectResults(
			findAndBind(teamCollection, {
				id,
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Cannot get team');
		}

		const fullTeam = await Team.Expand(results[0], account, schema);

		return new Team(fullTeam, schema);
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

		const teamObject: RawTeamObject = {
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
			visibility: TeamPublicity.PUBLIC
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
			if (
				senior.Asst === 0 &&
				senior.Duty === 'Deputy Commander for Cadets'
			) {
				teamObject.seniorMentor = {
					type: 'CAPNHQMember',
					id: senior.CAPID
				};
			}
		}

		const fullTeam = await Team.Expand(
			{
				...teamObject,
				_id: ''
			},
			account,
			schema
		);

		return new Team(fullTeam, schema);
	}

	public static async Create(
		data: NewTeamObject,
		account: Account,
		schema: Schema
	): Promise<Team> {
		const teamsCollection = schema.getCollection<RawTeamObject>(
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

		const newTeam: RawTeamObject = {
			...data,
			members: [],
			id,
			teamHistory: [],
			accountID: account.id
		};

		// tslint:disable-next-line:variable-name
		const _id = (await teamsCollection
			.add(newTeam)
			.execute()).getGeneratedIds()[0];

		const fullNewTeam = await Team.Expand(
			{
				...newTeam,
				_id
			},
			account,
			schema
		);

		const teamObject = new Team(fullNewTeam, schema);

		for (const i of data.members) {
			const fullMember = await MemberBase.ResolveReference(
				i.reference,
				account,
				schema
			);

			if (fullMember) {
				await teamObject.addTeamMember(
					fullMember,
					i.job,
					account,
					schema
				);
			}
		}

		await teamObject.updateTeamLeaders(account, schema);

		await teamObject.save();

		return teamObject;
	}

	private static collectionName = 'Teams';

	private static async Expand(
		raw: FullDBObject<RawTeamObject>,
		account: Account,
		schema: Schema
	): Promise<FullDBObject<FullTeamObject>>;

	private static async Expand(
		raw: RawTeamObject,
		account: Account,
		schema: Schema
	): Promise<FullTeamObject> {
		const [cadetLeader, seniorMentor, seniorCoach] = await Promise.all([
			MemberBase.ResolveReference(raw.cadetLeader, account, schema),
			MemberBase.ResolveReference(raw.seniorMentor, account, schema),
			MemberBase.ResolveReference(raw.seniorCoach, account, schema)
		]);

		const cadetLeaderName = cadetLeader ? cadetLeader.getFullName() : '';
		const seniorMentorName = seniorMentor ? seniorMentor.getFullName() : '';
		const seniorCoachName = seniorCoach ? seniorCoach.getFullName() : '';

		const members: FullTeamMember[] = [];

		for (const member of raw.members) {
			let fullMember;
			try {
				fullMember = await MemberBase.ResolveReference(
					member.reference,
					account,
					schema
				);
			} catch (e) {
				console.log('Could not get member ', member.reference);
			}

			if (fullMember) {
				members.push({
					...member,
					name: fullMember.getFullName()
				});
			}
		}

		const teamHistory: FullPreviousTeamMember[] = [];

		for (const member of raw.teamHistory) {
			const fullMember = await MemberBase.ResolveReference(
				member.reference,
				account,
				schema
			);

			if (fullMember) {
				teamHistory.push({
					...member,
					name: fullMember.getFullName()
				});
			}
		}

		const full: FullTeamObject = {
			...raw,
			cadetLeaderName,
			seniorCoachName,
			seniorMentorName,
			members,
			teamHistory
		};

		return full;
	}

	public id: number;

	public accountID: string;

	public name: string;

	public description: string;

	public members: FullTeamMember[] = [];

	public cadetLeader: MemberReference | null;

	public seniorCoach: MemberReference | null;

	public seniorMentor: MemberReference | null;

	public visibility: TeamPublicity;

	public teamHistory: FullPreviousTeamMember[] = [];

	public cadetLeaderName: string;

	public seniorCoachName: string;

	public seniorMentorName: string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private deleted = false;

	private constructor(
		data: FullDBObject<FullTeamObject>,
		private schema: Schema
	) {
		this.id = data.id;
		this._id = data._id;
		this.members = data.members;
		this.teamHistory = data.teamHistory;
		this.accountID = data.accountID;

		this.set(data);
	}

	public set(values: Partial<RawTeamObject>): boolean {
		values = {
			accountID: values.accountID,
			cadetLeader: values.cadetLeader,
			description: values.description,
			name: values.name,
			seniorCoach: values.seniorCoach,
			seniorMentor: values.seniorMentor,
			visibility: values.visibility
		};
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

		const teamCollection = this.schema.getCollection<RawTeamObject>(
			Team.collectionName
		);

		await teamCollection.replaceOne(this._id, this.toRawWithMembers());
	}

	public async delete(): Promise<void> {
		if (this.deleted) {
			throw new Error('Cannot operate on a deleted event');
		}

		if (this.id === 0) {
			throw new Error('Cannot operate on a dynamic team');
		}

		const teamCollection = this.schema.getCollection<RawTeamObject>(
			Team.collectionName
		);

		await teamCollection.removeOne(this._id);

		this.deleted = true;
	}

	public toRaw = (member?: MemberBase): RawTeamObject => ({
		accountID: this.accountID,
		cadetLeader: this.cadetLeader,
		description: this.description,
		id: this.id,
		members:
			!!member || this.visibility === TeamPublicity.PUBLIC
				? this.members.map(teammem => ({
						joined: teammem.joined,
						job: teammem.job,
						reference: teammem.reference
				  }))
				: [],
		name: this.name,
		seniorCoach: this.seniorCoach,
		seniorMentor: this.seniorMentor,
		visibility: this.visibility,
		teamHistory:
			!!member || this.visibility === TeamPublicity.PUBLIC
				? this.teamHistory.map(teammem => ({
						joined: teammem.joined,
						job: teammem.job,
						reference: teammem.reference,
						removed: teammem.removed
				  }))
				: []
	});

	public toFullRaw = (member?: MemberBase): FullTeamObject => ({
		...this.toRaw(),
		members:
			!!member || this.visibility === TeamPublicity.PUBLIC
				? this.members
				: [],
		teamHistory:
			!!member || this.visibility === TeamPublicity.PUBLIC
				? this.teamHistory
				: [],
		cadetLeaderName: this.cadetLeaderName,
		seniorCoachName: this.seniorCoachName,
		seniorMentorName: this.seniorMentorName
	});

	public toRawWithMembers = (): RawTeamObject => ({
		...this.toRaw(),
		members: this.members.map(member => ({
			joined: member.joined,
			job: member.job,
			reference: member.reference
		})),
		teamHistory: this.teamHistory.map(member => ({
			joined: member.joined,
			job: member.job,
			reference: member.reference,
			removed: member.removed
		}))
	});

	public hasMember(member: MemberReference) {
		return (
			this.members.filter(
				f => !MemberBase.AreMemberReferencesTheSame(member, f.reference)
			).length > 0
		);
	}

	public async addTeamMember(
		member: MemberBase,
		job: string,
		account: Account,
		schema: Schema
	) {
		const oldMember = this.members.filter(
			f =>
				!MemberBase.AreMemberReferencesTheSame(
					member.getReference(),
					f.reference
				)
		)[0];
		if (oldMember !== undefined) {
			this.modifyTeamMember(
				member.getReference(),
				`${oldMember.job}, ${job}`
			);
			return;
		}

		await this.updateMember(member.getReference(), account, schema);

		this.members.push({
			job,
			joined: +DateTime.utc(),
			reference: member.getReference(),
			name: member.getFullName()
		});
	}

	public async removeTeamMember(
		member: MemberReference,
		account: Account,
		schema: Schema
	) {
		// TODO: Change Extra Member Information to remove team ID

		if (!this.hasMember(member)) {
			return;
		}

		if (member.type === 'Null') {
			return;
		}

		const oldMember = this.members.filter(
			f => !MemberBase.AreMemberReferencesTheSame(member, f.reference)
		)[0];
		this.members = this.members.filter(
			f => !MemberBase.AreMemberReferencesTheSame(member, f.reference)
		);

		this.teamHistory.push({
			...oldMember,
			removed: Date.now()
		});

		const extraInformation = schema.getCollection<
			FullDBObject<ExtraMemberInformation>
		>('ExtraMemberInformation');

		const results = await collectResults(
			findAndBind(extraInformation, {
				...member,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accessLevel: 'Member',
				accountID: account.id,
				...member,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: []
			};

			await extraInformation
				.add(newInformation as FullDBObject<ExtraMemberInformation>)
				.execute();
		} else {
			const index = results[0].teamIDs.indexOf(this.id);
			if (index !== -1) {
				results[0].teamIDs.splice(index, 1);
			}

			await extraInformation.replaceOne(results[0]._id, results[0]);
		}
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

	public async updateMembers(
		oldMembers: RawTeamMember[],
		newMembers: RawTeamMember[],
		account: Account,
		schema: Schema
	) {
		for (let i = oldMembers.length - 1; i >= 0; i--) {
			if (
				newMembers.filter(member =>
					MemberBase.AreMemberReferencesTheSame(
						member.reference,
						oldMembers[i].reference
					)
				).length === 0
			) {
				this.removeTeamMember(oldMembers[i].reference, account, schema);
			}
		}

		for (let i = newMembers.length - 1; i >= 0; i--) {
			if (
				oldMembers.filter(member =>
					MemberBase.AreMemberReferencesTheSame(
						member.reference,
						newMembers[i].reference
					)
				).length === 0
			) {
				const fullMember = await MemberBase.ResolveReference(
					newMembers[i].reference,
					account,
					schema
				);

				await this.addTeamMember(
					fullMember,
					newMembers[i].job,
					account,
					schema
				);
			}
		}
	}

	public async updateTeamLeaders(account: Account, schema: Schema) {
		if (this.cadetLeader.type !== 'Null') {
			this.updateMember(this.cadetLeader, account, schema);
		}

		if (this.seniorCoach.type !== 'Null') {
			this.updateMember(this.seniorCoach, account, schema);
		}

		if (this.seniorMentor.type !== 'Null') {
			this.updateMember(this.seniorMentor, account, schema);
		}
	}

	private async updateMember(
		member: MemberReference,
		account: Account,
		schema: Schema
	) {
		if (member.type === 'Null') {
			return;
		}

		const extraInformation = schema.getCollection<
			FullDBObject<ExtraMemberInformation>
		>('ExtraMemberInformation');

		const results = await collectResults(
			findAndBind(extraInformation, {
				...member,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accessLevel: 'Member',
				accountID: account.id,
				...member,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: [this.id]
			};

			await extraInformation
				.add(newInformation as FullDBObject<ExtraMemberInformation>)
				.execute();
		} else {
			if (results[0].teamIDs.indexOf(this.id) === -1) {
				results[0].teamIDs.push(this.id);
			}

			await extraInformation.replaceOne(results[0]._id, results[0]);
		}
	}
}
