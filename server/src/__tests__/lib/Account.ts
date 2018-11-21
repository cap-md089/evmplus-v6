import * as request from 'supertest';
import conftest from "../../conf.test";
import getServer from "../../getServer";
import Account from "../../lib/Account";
import { getTestTools } from "../../lib/Util";

describe ('Account', () => {
	it('should fetch the development account', async done => {
		const { schema } = await getTestTools(conftest);

		const testAccount = await Account.Get('mdx89', schema);

		expect(testAccount.id).toEqual('mdx89');
		expect(testAccount.mainOrg).toEqual(916);

		done();
	});

	it('should build a valid URI', async done => {
		const { account } = await getTestTools(conftest);

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
		const { schema } = await getTestTools(conftest);

		await expect(Account.Get('not an account', schema)).rejects.toEqual(expect.any(Error));

		done();
	});

	it('should fail to get accounts that do not exist in requests', async done => {
		const { server } = await getServer(conftest, 3006);

		request('http://noacc.localcapunit.com:3006')
			.get('/api/accountcheck')
			.expect(400)
			.end((err) => {
				if (err) {
					throw err;
				}

				server.close();

				done();
			});
	});

	it('should generate members in the account', async done => {
		const { account } = await getTestTools(conftest);

		for await (const mem of account.getMembers()) {
			expect(account.orgIDs).toContain(mem.orgid);
		}

		done();
	});
});