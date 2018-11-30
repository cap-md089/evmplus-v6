import { Schema } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import Account from '../../lib/Account';
import { NHQMember } from '../../lib/Members';
import { collectResults } from '../../lib/MySQLUtil';
import Team from '../../lib/Team';
import { getTestTools2 } from '../../lib/Util';
import { newTeam, signinInformation } from '../consts';

describe('Team', () => {
	let schema: Schema;
	let account: Account;
	let member: NHQMember;
	let team: Team;

	beforeAll(async done => {
		[account, schema] = await getTestTools2(conftest);

		member = await NHQMember.Create(
			signinInformation.username,
			signinInformation.password,
			schema,
			account
		);

		await schema
			.getCollection('Teams')
			.remove('true')
			.execute();

		done();
	});

	it('should create a team', async done => {
		team = await Team.Create(newTeam, account, schema);

		const results = await collectResults(
			schema.getCollection('Teams').find('true')
		);

		expect(results.length).toBe(1);

		done();
	});

	it('should get team information', async done => {
		const teamGet = await Team.Get(team.id, account, schema);

		expect(teamGet.members).toEqual(newTeam.members);

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

	it('should add a team member', () => {
		team.addTeamMember(member.getReference(), 'Eh');

		expect(team.members.length).toEqual(2);
		expect(team.members[1].reference).toEqual(member.getReference());
	});

	it('should modify a team member', () => {
		const newJob = 'A new job';

		team.modifyTeamMember(member.getReference(), newJob);

		expect(team.members[1].job).toEqual(newJob);
	});

	it('should remove a team member', () => {
		team.removeTeamMember(member.getReference());

		expect(team.members.length).toEqual(1);
	});

	it('should delete team information', async done => {
		await team.delete();

		const results = await collectResults(
			schema.getCollection('Teams').find('true')
		);

		expect(results.length).toBe(0);

		done();
	});

	it('should fail to save or delete team information for a deleted team', async done => {
		await expect(team.save()).rejects.toEqual(expect.any(Error));
		await expect(team.delete()).rejects.toEqual(expect.any(Error));

		done();
	});
});
