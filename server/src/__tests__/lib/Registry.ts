import { Schema } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import Account from '../../lib/Account';
import { collectResults } from '../../lib/MySQLUtil';
import Registry from '../../lib/Registry';
import { getTestTools2 } from '../../lib/Util';

describe('Registry', () => {
	let account: Account;
	let schema: Schema;

	beforeAll(async done => {
		[account, schema] = await getTestTools2(conftest);

		await schema
			.getCollection('Registry')
			.remove('true')
			.execute();

		done();
	});

	afterAll(async done => {
		await schema
			.getCollection('Registry')
			.remove('true')
			.execute();

		done();
	});

	it(`should create registry values if they don't exist`, async done => {
		await Registry.Get(account, schema);

		const results = await collectResults(
			schema.getCollection('Registry').find('true')
		);

		expect(results.length).toEqual(1);

		done();
	});

	it('should get registry values', async done => {
		const reg = await Registry.Get(account, schema);

		expect(reg.values.Website.Separator).toEqual(' - ');

		done();
	});

	it('should save registry values', async done => {
		const reg = await Registry.Get(account, schema);

		reg.values.Contact.FaceBook = 'CAPStMarys';

		await reg.save();

		const regGet = await Registry.Get(account, schema);

		expect(regGet.values.Contact.FaceBook).toEqual('CAPStMarys');

		done();
	});
});
