import { Schema, Session } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import { Account, collectResults, getTestTools2, Registry } from '../../lib/internals';

describe('Registry', () => {
	let account: Account;
	let schema: Schema;
	let session: Session;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		await schema
			.getCollection('Registry')
			.remove('true')
			.execute();

		done();
	});

	afterAll(async done => {
		await Promise.all([
			schema
				.getCollection('Registry')
				.remove('true')
				.execute(),
			session.close()
		]);

		done();
	});

	it(`should create registry values if they don't exist`, async done => {
		await Registry.Get(account, schema);

		const results = await collectResults(schema.getCollection('Registry').find('true'));

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
