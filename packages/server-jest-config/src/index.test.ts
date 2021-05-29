import { getSession } from '@mysql/xdevapi';
import {
	addPresetRecords,
	COLLECTIONS_USED,
	getDbHandle,
	setPresetRecords,
	TestConnection,
} from '.';
import { UserAccountInformation } from '../../common-lib/dist';

describe('Docker TestConnection', () => {
	jest.setTimeout(15000);

	const dbRef = getDbHandle();

	beforeAll(dbRef.setup);
	afterAll(dbRef.teardown);

	it('should be able to connect to the mysql container', async done => {
		const sessionPromise = getSession(TestConnection.mysqlConnectionString);

		await expect(sessionPromise).resolves.not.toThrow();

		await (await sessionPromise).close();

		done();
	});

	it('should be able to create schemas', () => {
		const { connection } = dbRef;

		expect(connection.getSchema.bind(connection)).not.toThrow();
	});

	it('should be able to create collections', async done => {
		const { connection } = dbRef;

		const collections = await connection.getSchema().getCollections();

		expect(collections.map(collection => collection.getName()).sort()).toEqual(
			COLLECTIONS_USED.slice().sort(),
		);
		expect(collections.length).toBeGreaterThan(0);

		done();
	});

	it('should be able to preset data', async done => {
		const id = 56;

		await addPresetRecords(dbRef.connection.getSchema())({
			UserAccountInfo: [
				{ member: { type: 'CAPNHQMember', id }, passwordHistory: [], username: '' },
			],
		});

		const records = (
			await dbRef.connection
				.getSchema()
				.getCollection<UserAccountInformation>('UserAccountInfo')
				.find('true')
				.execute()
		).fetchAll();
		expect(records).toHaveLength(1);
		expect(records[0].member.id).toEqual(id);

		done();
	});

	it('should be able to force a clean slate', async done => {
		const id = 56;

		await addPresetRecords(dbRef.connection.getSchema())({
			UserAccountInfo: [
				{ member: { type: 'CAPNHQMember', id }, passwordHistory: [], username: '' },
				{ member: { type: 'CAPNHQMember', id: id + 1 }, passwordHistory: [], username: '' },
				{ member: { type: 'CAPNHQMember', id: id + 2 }, passwordHistory: [], username: '' },
				{ member: { type: 'CAPNHQMember', id: id + 3 }, passwordHistory: [], username: '' },
			],
		});

		await setPresetRecords({
			UserAccountInfo: [
				{ member: { type: 'CAPNHQMember', id: id + 4 }, passwordHistory: [], username: '' },
			],
		})(dbRef)();

		const records = (
			await dbRef.connection
				.getSchema()
				.getCollection<UserAccountInformation>('UserAccountInfo')
				.find('true')
				.execute()
		).fetchAll();
		expect(records).toHaveLength(1);
		expect(records[0].member.id).toEqual(id + 4);

		done();
	});
});
