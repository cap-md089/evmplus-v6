import { COLLECTIONS_USED, TestConnection } from '.';
import * as Docker from 'dockerode';
import { getClient } from '@mysql/xdevapi';

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

		beforeEach(TestCases.setup);
		afterEach(TestCases.teardown);

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

			await expect(
				getClient(TestCases.mysqlConnString, {}).getSession(),
			).resolves.not.toThrow();

			done();
		}, 25000);

		it('should be able to create schemas', async done => {
			const connection = await TestCases.setupSchema();

			expect(connection.getSchema.bind(connection)).not.toThrow();

			done();
		}, 25000);

		it('should be able to create collections', async done => {
			const connection = await TestCases.setupSchema();

			const collections = await connection.getSchema().getCollections();

			expect(collections.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);
			expect(collections.length).toBeGreaterThan(0);

			done();
		}, 25000);

		it('should create multiple schemas', async done => {
			const [conn1, conn2] = await Promise.all([
				TestCases.setupSchema(),
				TestCases.setupSchema(),
			]);

			expect(conn1.getSchema.bind(conn1)).not.toThrow();
			expect(conn2.getSchema.bind(conn2)).not.toThrow();

			expect(conn1.schema).not.toEqual(conn2.schema);

			done();
		}, 25000);

		it('should create collections multiple times', async done => {
			const [conn1, conn2] = await Promise.all([
				TestCases.setupSchema(),
				TestCases.setupSchema(),
			]);

			const [collections1, collections2] = await Promise.all([
				conn1.getSchema().getCollections(),
				conn2.getSchema().getCollections(),
			]);

			expect(collections1.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);
			expect(collections2.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);

			done();
		}, 25000);
	});
} else {
	describe('Docker TestConnection', () => {
		jest.setTimeout(25000);

		beforeEach(TestCases.setup);
		afterEach(TestCases.teardown);

		it('should be able to connect to the mysql container', async done => {
			expect(TestCases.mysqlConnString).not.toBeUndefined();

			await expect(
				getClient(TestCases.mysqlConnString, {}).getSession(),
			).resolves.not.toThrow();

			done();
		}, 25000);

		it('should be able to create schemas', async done => {
			const connection = await TestCases.setupSchema();

			expect(connection.getSchema.bind(connection)).not.toThrow();

			done();
		}, 25000);

		it('should be able to create collections', async done => {
			const connection = await TestCases.setupSchema();

			const collections = await connection.getSchema().getCollections();

			expect(collections.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);
			expect(collections.length).toBeGreaterThan(0);

			done();
		}, 25000);

		it('should create multiple schemas', async done => {
			const [conn1, conn2] = await Promise.all([
				TestCases.setupSchema(),
				TestCases.setupSchema(),
			]);

			expect(conn1.getSchema.bind(conn1)).not.toThrow();
			expect(conn2.getSchema.bind(conn2)).not.toThrow();

			expect(conn1.schema).not.toEqual(conn2.schema);

			done();
		}, 25000);

		it('should create collections multiple times', async done => {
			const [conn1, conn2] = await Promise.all([
				TestCases.setupSchema(),
				TestCases.setupSchema(),
			]);

			const [collections1, collections2] = await Promise.all([
				conn1.getSchema().getCollections(),
				conn2.getSchema().getCollections(),
			]);

			expect(collections1.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);
			expect(collections2.map(collection => collection.getName()).sort()).toEqual(
				COLLECTIONS_USED.slice().sort(),
			);

			done();
		}, 25000);
	});
}
