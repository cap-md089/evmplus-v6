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

import { Schema, Session } from '@mysql/xdevapi';
import { RawTeamObject } from 'common-lib';
import { EventEmitter } from 'events';
import conftest from '../../conf.test';
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

		await schema.getCollection('Teams').remove('true').execute();

		done();
	});

	beforeEach(async done => {
		team = await Team.Create(newTeam, account, schema, new EventEmitter());

		done();
	});

	afterEach(async done => {
		await schema.getCollection('Teams').remove('true').execute();

		done();
	});

	afterAll(async done => {
		await session.close();

		done();
	});

	it('should create a team', async done => {
		const newTeamObject = await Team.Create(newTeam, account, schema, new EventEmitter());

		const results = await collectResults(
			safeBind(schema.getCollection<RawTeamObject>('Teams').find('id = :id'), {
				id: newTeamObject.id,
			})
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
		await team.addTeamMember(member, 'Eh', account, schema, new EventEmitter());

		expect(team.members.length).toEqual(2);
		expect(team.members[1].reference).toEqual(member.getReference());

		done();
	});

	it('should modify a team member', async done => {
		await team.addTeamMember(member, 'Eh', account, schema, new EventEmitter());

		const newJob = 'A new job';

		await team.modifyTeamMember(member.getReference(), newJob);

		expect(team.members[1].job).toEqual(newJob);

		done();
	});

	it('should remove a team member', () => {
		team.removeTeamMember(member.getReference(), account, schema, new EventEmitter());

		expect(team.members.length).toEqual(1);
	});

	it('should delete team information', async done => {
		await team.delete(new EventEmitter());

		const results = await collectResults(schema.getCollection('Teams').find('true'));

		expect(results.length).toBe(0);

		done();
	});

	it('should fail to save or delete team information for a deleted team', async done => {
		await team.delete(new EventEmitter());

		await expect(team.save()).rejects.toEqual(expect.any(Error));
		await expect(team.delete(new EventEmitter())).rejects.toEqual(expect.any(Error));

		done();
	});
});
