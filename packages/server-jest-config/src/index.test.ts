import { getSession } from '@mysql/xdevapi';
import { COLLECTIONS_USED, getDbRef, TestConnection } from '.';

class TestCases extends TestConnection {
	public static get mysqlConnString() {
		return this.mysqlConnectionString;
	}
}

describe('Docker TestConnection', () => {
	jest.setTimeout(25000);

	const dbRef = getDbRef();

	beforeAll(TestCases.setup(dbRef));
	afterAll(TestCases.teardown(dbRef));

	it('should be able to connect to the mysql container', async done => {
		const sessionPromise = getSession(TestCases.mysqlConnString);

		await expect(sessionPromise).resolves.not.toThrow();

		await (await sessionPromise).close();

		done();
	}, 25000);

	it('should be able to create schemas', async done => {
		const { connection } = dbRef;

		expect(connection.getSchema.bind(connection)).not.toThrow();

		done();
	}, 25000);

	it('should be able to create collections', async done => {
		const { connection } = dbRef;

		const collections = await connection.getSchema().getCollections();

		expect(collections.map(collection => collection.getName()).sort()).toEqual(
			COLLECTIONS_USED.slice().sort(),
		);
		expect(collections.length).toBeGreaterThan(0);

		done();
	}, 25000);
});
