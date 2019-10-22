import { Schema, Session } from '@mysql/xdevapi';
import { RawTeamObject } from 'common-lib';
import conftest from '../../conf.test';
import { Account, CAPNHQMember, collectResults, getTestTools2, Team } from '../../lib/internals';
import { newTeam } from '../consts';

describe('Team', () => {
	let schema: Schema;
	let account: Account;
	let session: Session;
	let member: CAPNHQMember;
	let team: Team;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		member = await CAPNHQMember.Get(542488, account, schema);

		await schema
			.getCollection('Teams')
			.remove('true')
			.execute();

		done();
	});

	beforeEach(async done => {
		team = await Team.Create(newTeam, account, schema);

		done();
	});

	afterEach(async done => {
		await schema
			.getCollection('Teams')
			.remove('true')
			.execute();

		done();
	});

	afterAll(async done => {
		await session.close();

		done();
	});

	it('should create a team', async done => {
		const newTeamObject = await Team.Create(newTeam, account, schema);

		const results = await collectResults(
			schema.getCollection<RawTeamObject>('Teams').find('id = :id').bind({ id: newTeamObject.id })
		);

		expect(results.length).toBe(1);
		expect(results[0].members.length).toBe(1);

		done();
	});

	it('should get team information', async done => {
		const teamGet = await Team.Get(team.id, account, schema);

		expect(teamGet.seniorCoach).toEqual(newTeam.seniorCoach);
		expect(teamGet.cadetLeader).toEqual(newTeam.cadetLeader);

		done();
	});

	it('should save team information', async done => {
		const newDescription = 'A desc';

		team.description = newDescription;

		await team.save();

		const teamGet = await Team.Get(team.id, account, schema);

		expect(teamGet.description).toEqual(newDescription);

		done();
	});

	it('should add a team member', async done => {
		await team.addTeamMember(member, 'Eh', account, schema);

		expect(team.members.length).toEqual(2);
		expect(team.members[1].reference).toEqual(member.getReference());

		done();
	});

	it('should modify a team member', async done => {
		await team.addTeamMember(member, 'Eh', account, schema);

		const newJob = 'A new job';

		await team.modifyTeamMember(member.getReference(), newJob);

		expect(team.members[1].job).toEqual(newJob);

		done();
	});

	it('should remove a team member', () => {
		team.removeTeamMember(member.getReference(), account, schema);

		expect(team.members.length).toEqual(1);
	});

	it('should delete team information', async done => {
		await team.delete();

		const results = await collectResults(schema.getCollection('Teams').find('true'));

		expect(results.length).toBe(0);

		done();
	});

	it('should fail to save or delete team information for a deleted team', async done => {
		await team.delete();

		await expect(team.save()).rejects.toEqual(expect.any(Error));
		await expect(team.delete()).rejects.toEqual(expect.any(Error));

		done();
	});
});
