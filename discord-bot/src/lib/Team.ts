import { Schema } from '@mysql/xdevapi';
import {
	ExtraMemberInformation,
	FullDBObject,
	FullPreviousTeamMember,
	FullTeamMember,
	FullTeamObject,
	MemberReference,
	NHQ,
	RawTeamMember,
	RawTeamObject,
	TeamPublicity
} from 'common-lib';
import {
	areMemberReferencesTheSame,
	collectResults,
	Account,
	MemberBase,
	findAndBind,
	generateResults,
	resolveReference
} from './internals';

export default class Team implements FullTeamObject {
	public static async Get(id: number | string, account: Account, schema: Schema): Promise<Team> {
		id = parseInt(id.toString(), 10);
		// Team 0 is reserved for the cadet staff
		if (id === 0) {
			return Team.GetStaffTeam(account, schema);
		}

		const teamCollection = schema.getCollection<FullDBObject<RawTeamObject>>(
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

		const fullTeam = await Team.Expand(results[0], account, schema);

		return new Team(fullTeam); //, account, schema);
	}

	public static async GetRawStaffTeam(account: Account, schema: Schema): Promise<RawTeamObject> {
		const cadetDutyPositions = schema.getCollection<NHQ.CadetDutyPosition>(
			'NHQ_CadetDutyPosition'
		);
		const dutyPositions = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');

		const teamObject: RawTeamObject = {
			accountID: account.id,
			cadetLeader: {
				type: 'Null'
			},
			description: 'Cadet Staff',
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

		const cadetGenerators = [];

		for (const ORGID of account.orgIDs) {
			cadetGenerators.push(
				generateResults(
					findAndBind(cadetDutyPositions, {
						ORGID
					})
				)
			);
		}

		const cadets: {
			[key: number]: {
				positions: string[];
				joined: number;
			};
		} = {};

		for (const generator of cadetGenerators) {
			for await (const cadetDutyPosition of generator) {
				if (cadetDutyPosition.Duty === 'Cadet Commander') {
					teamObject.cadetLeader = {
						type: 'CAPNHQMember',
						id: cadetDutyPosition.CAPID
					};
				}

				if (!cadets[cadetDutyPosition.CAPID]) {
					cadets[cadetDutyPosition.CAPID] = {
						positions: [cadetDutyPosition.Duty],
						joined: +new Date(cadetDutyPosition.DateMod)
					};
				} else {
					const cadet = cadets[cadetDutyPosition.CAPID];

					cadet.positions.push(cadetDutyPosition.Duty);
					cadet.joined = Math.min(cadet.joined, +new Date(cadetDutyPosition.DateMod));
				}
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
			if (senior.Asst === 0) {
				teamObject.seniorMentor = {
					type: 'CAPNHQMember',
					id: senior.CAPID
				};
			}
		}

		return teamObject;
	}

	public static async GetStaffTeam(account: Account, schema: Schema): Promise<Team> {
		const teamObject = await this.GetRawStaffTeam(account, schema);

		const fullTeam = await Team.Expand(
			{
				...teamObject,
				_id: ''
			},
			account,
			schema
		);

		return new Team(fullTeam); //, account, schema);
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
			resolveReference(raw.cadetLeader, account, schema).catch(() => null),
			resolveReference(raw.seniorMentor, account, schema).catch(() => null),
			resolveReference(raw.seniorCoach, account, schema).catch(() => null)
		]);

		const cadetLeaderName = cadetLeader ? cadetLeader.getFullName() : '';
		const seniorMentorName = seniorMentor ? seniorMentor.getFullName() : '';
		const seniorCoachName = seniorCoach ? seniorCoach.getFullName() : '';

		const members: FullTeamMember[] = [];

		for (const member of raw.members) {
			let fullMember;
			try {
				fullMember = await resolveReference(member.reference, account, schema);
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
			try {
				const fullMember = await resolveReference(member.reference, account, schema);

				if (fullMember) {
					teamHistory.push({
						...member,
						name: fullMember.getFullName()
					});
				}
			} catch (e) {}
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

	public cadetLeader: MemberReference;

	public seniorCoach: MemberReference;

	public seniorMentor: MemberReference;

	public visibility: TeamPublicity;

	public teamHistory: FullPreviousTeamMember[] = [];

	public cadetLeaderName: string;

	public seniorCoachName: string;

	public seniorMentorName: string;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private constructor(
		data: FullDBObject<FullTeamObject>
		// private account: Account,
		// private schema: Schema
	) {
		this.id = data.id;
		this._id = data._id;
		this.name = data.name;
		this.description = data.description;
		this.cadetLeader = data.cadetLeader;
		this.seniorCoach = data.seniorCoach;
		this.seniorMentor = data.seniorMentor;
		this.visibility = data.visibility;
		this.members = data.members;
		this.teamHistory = data.teamHistory;
		this.accountID = data.accountID;
		this.seniorCoachName = data.seniorCoachName;
		this.seniorMentorName = data.seniorMentorName;
		this.cadetLeaderName = data.cadetLeaderName;
	}

	public hasMember(member: MemberReference) {
		return this.members.filter(f => areMemberReferencesTheSame(member, f.reference)).length > 0;
	}

	public isLeader(member: MemberReference) {
		if (areMemberReferencesTheSame(member, this.cadetLeader)) {
			return true;
		}
		if (areMemberReferencesTheSame(member, this.seniorCoach)) {
			return true;
		}
		if (areMemberReferencesTheSame(member, this.seniorMentor)) {
			return true;
		}
		return false;
	}

	public isMemberOrLeader(member: MemberReference) {
		if (areMemberReferencesTheSame(member, this.cadetLeader)) {
			return true;
		}
		if (areMemberReferencesTheSame(member, this.seniorCoach)) {
			return true;
		}
		if (areMemberReferencesTheSame(member, this.seniorMentor)) {
			return true;
		}
		return this.hasMember(member);
	}

	public async addTeamMember(member: MemberBase, job: string, account: Account, schema: Schema) {
		const oldMember = this.members.filter(f =>
			areMemberReferencesTheSame(member.getReference(), f.reference)
		)[0];
		if (oldMember !== undefined) {
			this.modifyTeamMember(member.getReference(), `${oldMember.job}, ${job}`);
			return;
		}

		await this.updateMember(member.getReference(), account, schema);

		this.members.push({
			job,
			joined: +new Date(),
			reference: member.getReference(),
			name: member.getFullName()
		});
	}

	public async removeTeamLeader(member: MemberReference, account: Account, schema: Schema) {
		if (!this.isMemberOrLeader(member) && this.hasMember(member)) {
			return;
		}

		if (member.type === 'Null') {
			return;
		}

		const extraInformation = schema.getCollection<FullDBObject<ExtraMemberInformation>>(
			'ExtraMemberInformation'
		);

		const results = await collectResults(
			findAndBind(extraInformation, {
				...member,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accountID: account.id,
				member,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: [],
				absentee: null
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

	public async removeTeamMember(member: MemberReference, account: Account, schema: Schema) {
		if (!this.hasMember(member)) {
			return;
		}

		if (member.type === 'Null') {
			return;
		}

		const oldMember = this.members.filter(
			f => !areMemberReferencesTheSame(member, f.reference)
		)[0];
		this.members = this.members.filter(f => !areMemberReferencesTheSame(member, f.reference));

		this.teamHistory.push({
			...oldMember,
			removed: Date.now()
		});

		const extraInformation = schema.getCollection<FullDBObject<ExtraMemberInformation>>(
			'ExtraMemberInformation'
		);

		const results = await collectResults(
			findAndBind(extraInformation, {
				...member,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accountID: account.id,
				member,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: [],
				absentee: null
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
		for (const teamMember of this.members) {
			if (areMemberReferencesTheSame(member, teamMember.reference)) {
				teamMember.job = job;
				break;
			}
		}
	}

	public async updateMembers(
		oldMembers: RawTeamMember[],
		newMembers: RawTeamMember[],
		account: Account,
		schema: Schema
	) {
		for (const oldMember of oldMembers) {
			if (
				newMembers.filter(member =>
					areMemberReferencesTheSame(member.reference, oldMember.reference)
				).length === 0
			) {
				this.removeTeamMember(oldMember.reference, account, schema);
			}
		}

		for (const newMember of newMembers) {
			if (
				oldMembers.filter(member =>
					areMemberReferencesTheSame(member.reference, newMember.reference)
				).length === 0
			) {
				const fullMember = await resolveReference(
					newMember.reference,
					account,
					schema,
					true
				);

				await this.addTeamMember(fullMember, newMember.job, account, schema);
			} else {
				this.modifyTeamMember(newMember.reference, newMember.job);
			}
		}
	}

	public async updateTeamLeaders(account: Account, schema: Schema) {
		if (this.cadetLeader && this.cadetLeader.type !== 'Null') {
			this.updateMember(this.cadetLeader, account, schema);
		}

		if (this.seniorCoach && this.seniorCoach.type !== 'Null') {
			this.updateMember(this.seniorCoach, account, schema);
		}

		if (this.seniorMentor && this.seniorMentor.type !== 'Null') {
			this.updateMember(this.seniorMentor, account, schema);
		}
	}

	private async updateMember(member: MemberReference, account: Account, schema: Schema) {
		if (member.type === 'Null') {
			return;
		}

		const extraInformation = schema.getCollection<FullDBObject<ExtraMemberInformation>>(
			'ExtraMemberInformation'
		);

		const results = await collectResults(
			findAndBind(extraInformation, {
				...member,
				accountID: account.id
			})
		);

		if (results.length === 0) {
			const newInformation: ExtraMemberInformation = {
				accountID: account.id,
				member,
				temporaryDutyPositions: [],
				flight: null,
				teamIDs: [this.id],
				absentee: null
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
