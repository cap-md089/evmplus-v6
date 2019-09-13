import { Schema } from '@mysql/xdevapi';
import * as request from 'supertest';
import conftest from '../../conf.test';
import getServer from '../../getServer';
import { Account, CAPNHQMember, Event, getTestTools } from '../../lib/internals';
import { newEvent, rawAccount } from '../consts';

describe('Account', () => {
	let schema: Schema;
	let account: Account;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		schema = results.schema;
		account = results.account;

		done();
	});

	afterAll(async done => {
		await schema
			.getCollection('Accounts')
			.remove('true')
			.execute();

		done();
	});

	it('should fetch an account', async done => {
		const testAccount = await Account.Get('mdx89', schema);

		expect(testAccount.id).toEqual('mdx89');
		expect(testAccount.mainOrg).toEqual(916);

		done();
	});

	it('should allow creating an account', async done => {
		const testAccount = await Account.Create(rawAccount, schema);

		const testAccountGet = await Account.Get(testAccount.id, schema);

		expect(testAccount.id).toEqual(testAccountGet.id);
		expect(testAccount.adminIDs).toEqual(testAccountGet.adminIDs);

		done();
	});

	it('should build a valid URI', async done => {
		// NODE_ENV !== production
		expect(account.buildURI('api', 'echo')).toEqual('/api/echo');

		// NODE_ENV = production
		const previousEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';

		expect(account.buildURI('api', 'echo')).toEqual('https://mdx89.capunit.com/api/echo');

		process.env.NODE_ENV = previousEnv;

		done();
	});

	it(`should fail to get accounts that don't exist`, async done => {
		await expect(Account.Get('not an account', schema)).rejects.toEqual(expect.any(Error));

		done();
	});

	it('should fail to get accounts that do not exist in requests', async done => {
		const { server } = await getServer(conftest, 3006);

		request('http://noacc.localcapunit.com:3006')
			.get('/api/accountcheck')
			.expect(400)
			.end(err => {
				done();
				if (err) {
					throw err;
				}

				server.close();

				done();
			});
	});

	it('should generate members in the account', async done => {
		for await (const mem of account.getMembers()) {
			expect(account.orgIDs).toContain(mem.orgid);
		}

		done();
	});

	it('should get events only in the account', async done => {
		const mem = await CAPNHQMember.Get(542488, account, schema);

		const testAccount = await Account.Create(rawAccount, schema);

		const [testEvent1, testEvent2] = await Promise.all([
			Event.Create(newEvent, account, schema, mem),
			Event.Create(newEvent, testAccount, schema, mem)
		]);

		for await (const i of account.getEvents()) {
			expect(i.accountID).toEqual(account.id);
		}

		await Promise.all([testEvent1.remove(), testEvent2.remove()]);

		done();
	});

	it('should correctly get the squadron name', () => {
		expect(account.getSquadronName()).toEqual('MDX-89');
	});

	it('should correctly save an account', async done => {
		account.expires += 1000;

		await account.save();

		const accountGet = await Account.Get(account.id, schema);

		expect(account.expires).toEqual(accountGet.expires);

		done();
	});
});
