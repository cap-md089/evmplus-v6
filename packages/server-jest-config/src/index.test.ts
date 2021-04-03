import { getSession } from '@mysql/xdevapi';
import * as Docker from 'dockerode';
import { COLLECTIONS_USED, getDbRef, TestConnection } from '.';

class TestCases extends TestConnection {
	public static get connectionInfo() {
		return this.currentConnection;
	}

	public static get mysqlConnString() {
		return this.mysqlConnectionString;
	}
}

// If in a docker test environment set up by Docker compose,
// there should be no tests for a docker container being set up
// because it is already set up
if (!process.env.IN_DOCKER_TEST_ENVIRONMENT) {
	describe('Raw TestConnection', () => {
		jest.setTimeout(25000);

		const dbRef = getDbRef();

		beforeEach(TestCases.setup(dbRef));
		afterEach(TestCases.teardown(dbRef));

		it('should start a docker image', async done => {
			const dockerConn = new Docker();

			const info = await TestCases.connectionInfo!;
			const containers = await dockerConn.listContainers();

			expect(
				containers.find(container => container.Id === info.dockerContainer.id),
			).not.toBeUndefined();

			done();
		}, 25000);

		it('should be able to connect to the mysql container', async done => {
			expect(TestCases.mysqlConnString).not.toBeUndefined();

			const sessionPromise = getSession(TestCases.mysqlConnString!);

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
} else {
	describe('Docker TestConnection', () => {
		jest.setTimeout(25000);

		const dbRef = getDbRef();

		beforeAll(TestCases.setup(dbRef));
		afterAll(TestCases.teardown(dbRef));

		it('should be able to connect to the mysql container', async done => {
			expect(TestCases.mysqlConnString).not.toBeUndefined();

			const sessionPromise = getSession(TestCases.mysqlConnString!);

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
}
