/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Client, getClient, getSession, Schema, Session } from '@mysql/xdevapi';
import { execFile } from 'child_process';
import {
	AccountType,
	CAPMemberContact,
	CAPMemberContactType,
	CAPNHQMemberObject,
	CAPNHQMemberReference,
	getDefaultMemberPermissions,
	Member,
	MemberPermissions,
	memoize,
	ShortDutyPosition,
	TableDataType,
	TableNames,
	User,
} from 'common-lib';
import * as Docker from 'dockerode';
import { DateTime } from 'luxon';
import { resolve } from 'path';
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

const getDockerConn = memoize(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	(a?: undefined) =>
		new Docker({
			socketPath: '/var/run/docker.sock',
		}),
);

const randomId = (): string =>
	Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/**
 * This is supposed to match the configuration provided by the mysql dump file
 */
export const COLLECTIONS_USED: readonly string[] = [
	'Accounts',
	'Attendance',
	'Audits',
	'ChangeEvents',
	'ChangeLog',
	'DiscordAccounts',
	'Errors',
	'Events',
	'ExtraAccountMembership',
	'ExtraMemberInformation',
	'Files',
	'MemberSessions',
	'MFASetup',
	'MFATokens',
	'NHQ_CadetAchv',
	'NHQ_CadetAchvAprs',
	'NHQ_CadetActivities',
	'NHQ_CadetDutyPosition',
	'NHQ_CadetHFZInformation',
	'NHQ_CdtAchvEnum',
	'NHQ_Commanders',
	'NHQ_eServices_Session',
	'NHQ_DutyPosition',
	'NHQ_MbrAchievements',
	'NHQ_MbrContact',
	'NHQ_Member',
	'NHQ_OFlight',
	'NHQ_Organization',
	'NHQ_OrgContact',
	'NHQ_PL_Groups',
	'NHQ_PL_Lookup',
	'NHQ_PL_MemberPathCredit',
	'NHQ_PL_MemberTaskCredit',
	'NHQ_PL_Paths',
	'NHQ_PL_TaskGroupAssignments',
	'NHQ_PL_Tasks',
	'NHQ_SeniorAwards',
	'NHQ_SeniorLevel',
	'Notifications',
	'OAuthClients',
	'PasswordResetTokens',
	'ProspectiveMembers',
	'Registry',
	'Sessions',
	'SignatureNonces',
	'SigninKeys',
	'SignInLog',
	'SigninTokens',
	'Tasks',
	'Teams',
	'Tokens',
	'UserAccountInfo',
	'UserAccountTokens',
	'UserPermissions',
];

/**
 * Represents the connection to a test database as well as a handle on a unique, clean schema
 *
 * This class initializes a MySQL schema for each of the test suites
 */
export class TestConnection {
	private constructor(
		public readonly client: Client,
		public readonly session: Session,
		public readonly schema: string, // eslint-disable-next-line no-empty-function
	) {}

	/**
	 * Initializes dbRef to hold a test database connection. This function returns a callback to
	 * be used by Jest, e.g.:
	 *
	 * <code>
	 * 	const ref = getDbRef();
	 *
	 * 	beforeAll(TestConnection.setup(ref));
	 * </code>
	 *
	 * @param dbRef a handle to a database connection
	 * @returns a callback function to pass to beforeAll()
	 */
	public static setup = (dbRef: DatabaseHandle) => async (done?: () => void): Promise<void> => {
		const connString = TestConnection.mysqlConnectionString;

		while (true) {
			try {
				const conn = await getSession(connString);
				await conn.close();

				break;
			} catch (e) {
				await new Promise<void>(res => setTimeout(res, 1000));
			}
		}
		dbRef.connection = await TestConnection.setupSchema();
		done?.();
	};

	/**
	 * Closes the database connection and performs cleanup. Returns a function intended to
	 * be called by afterAll()
	 *
	 * <code>
	 * 	const ref = getDbRef();
	 *
	 * 	beforeAll(TestConnection.setup(ref));
	 * 	afterAll(TestConnection.teardown(ref));
	 * </code>
	 *
	 * @param dbRef
	 * @returns
	 */
	public static teardown = (dbRef: DatabaseHandle) => async (
		done?: () => void,
	): Promise<void> => {
		await dbRef.connection.session.dropSchema(dbRef.connection.schema);
		await Promise.all([dbRef.connection.client.close(), dbRef.connection.session.close()]);

		done?.();
	};

	/**
	 * Creates a new schema and sets up the collections using the mysql dump script
	 *
	 * @returns the new connection with the schema set up
	 */
	private static async setupSchema(): Promise<TestConnection> {
		const schema = randomId();

		await TestConnection.setupCollections(schema);

		const client = getClient(this.mysqlConnectionString, {
			pooling: {
				enabled: true,
				maxSize: 10,
			},
		});

		const session = await client.getSession();

		const connection = new TestConnection(client, session, schema);
		return connection;
	}

	/**
	 * Sets up the different collections in a schema by using the docker
	 * connection to execute the setup-schema script inside of the MySQL container
	 *
	 * @param schema the name of the schema to setup
	 */
	private static async setupCollections(schema: string): Promise<void> {
		if (process.env.GITHUB_ACTIONS_ENV) {
			const path = resolve(__dirname, '../test-data/setup-schema.sh');
			await execFilePromise(path, [schema], {
				cwd: resolve(__dirname, '../../..'),
			});
		} else {
			const dockerConn = getDockerConn(void 0);

			const container = dockerConn.getContainer('evmplus_test-mysql');

			const exec = await container.exec({
				Cmd: ['sh', 'packages/server-jest-config/test-data/setup-schema.sh', schema],
				Tty: true,
				AttachStdout: false,
				AttachStderr: false,
				AttachStdin: false,
				Env: [],
				WorkingDir: '/usr/evm-plus/',
			});

			const stream = await exec.start({});

			(container.modem as {
				demuxStream(
					inputStream: typeof stream,
					out: typeof process.stdout,
					err: typeof process.stderr,
				): void;
			}).demuxStream(stream, process.stdout, process.stderr);

			await new Promise(res => {
				stream.on('end', res);
			});

			await exec.inspect();
		}

		const session = await getSession(this.mysqlConnectionString);

		let collections;

		do {
			if (collections) {
				await new Promise(res => setTimeout(res, 250));
			}
			collections = await session.getSchema(schema).getCollections();
		} while (collections.length !== COLLECTIONS_USED.length);

		await session.close();
	}

	/**
	 * Returns the constant connection string for connecting to the test mysql database
	 */
	public static get mysqlConnectionString(): string {
		return process.env.GITHUB_ACTIONS_ENV
			? 'mysqlx://root:root@localhost:33060'
			: 'mysqlx://root:root@test-mysql:33060';
	}

	/**
	 * @returns the current schema that is used for the test
	 */
	public getSchema = (): Schema => this.session.getSchema(this.schema);

	/**
	 * @returns a new session for when multiple sessions are needed
	 */
	public getNewSession = (): Promise<Session> => this.client.getSession();
}

export default TestConnection;

export { default as getConf } from './conf';

/**
 * Interface for holding both the connection and the ability to set it up as well as
 * tear it down before and after all tests
 *
 * While technically it could be used before and after each test, it's not necessary
 */
export interface DatabaseHandle {
	/**
	 * Holds the test connection information
	 */
	connection: TestConnection;
	/**
	 * A shorthand for TestConnection.setup(ref)
	 *
	 * @param done done callback provided by beforeAll
	 */
	setup(this: void, done?: () => void): void;
	/**
	 * A shorthand for TestConnection.teardown(ref)
	 *
	 * @param done done callback provided by afterAll
	 */
	teardown(this: void, done?: () => void): void;
}

/**
 * Initializes a database handle for use in tests
 */
export const getDbHandle = (): DatabaseHandle => {
	const ref: DatabaseHandle = {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		connection: null!,
		async setup(done) {
			await TestConnection.setup(ref)(done);
		},
		async teardown(done) {
			await TestConnection.teardown(ref)(done);
		},
	};

	return ref;
};

export type PresetRecords = {
	[key in TableNames]?: Array<TableDataType<key>>;
};

/**
 * Adds all of the records specified by the PresetRecords map, where each field
 * represents a table and the array values are added to that table
 *
 * @param schema the schema to modify and set up
 * @param map the data to set up in the schema
 */
export const addPresetRecords = (schema: Schema) => async (map: PresetRecords): Promise<void> => {
	const promises = [];

	for (const tableName in map) {
		if (map.hasOwnProperty(tableName)) {
			const table = tableName as TableNames;

			const records = map[table];

			if (!records || records.length === 0) {
				continue;
			}

			let adder = schema.getCollection(table).add(records[0]);

			for (const record of records.slice(1)) {
				adder = adder.add(record);
			}

			promises.push(adder.execute());
		}
	}

	await Promise.all(promises);
};

/**
 * Adds all of the records specified by the PresetRecords map, where each field
 * represents a table and the array values are added to that table
 *
 * This function is intended to be called by beforeEach
 *
 * <code>
 * 	const testSetup = setPresetRecords({
 * 		...
 * 	})
 *
 * 	describe('test suite', () => {
 * 		const dbHandle = getDbHandle();
 *
 * 		beforeAll(dbHandle.setup);
 * 		afterAll(dbHandle.teardown);
 *
 * 		beforeEach(testSetup(dbHandle))
 * 	})
 * </code>
 *
 * @param schema the schema to modify and set up
 * @param map the data to set up in the schema
 */
export const setPresetRecords = (records: PresetRecords) => (ref: DatabaseHandle) => async (
	done?: () => void,
): Promise<void> => {
	await Promise.all(
		COLLECTIONS_USED.map(name =>
			ref.connection.getSchema().getCollection(name).remove('true').execute(),
		),
	);

	await addPresetRecords(ref.connection.getSchema())(records);

	done?.();
};

type Names =
	| 'Member'
	| 'DutyPosition'
	| 'MbrContact'
	| 'CadetDutyPositions'
	| 'CadetActivities'
	| 'OFlight'
	| 'MbrAchievements'
	| 'CadetAchv'
	| 'CadetAchvAprs'
	| 'CdtAchvEnum'
	| 'CadetHFZInformation'
	| 'Organization';

type DBNames = Exclude<Names, 'CadetDutyPositions'> | 'CadetDutyPosition';

type TableForm<T extends string> = `NHQ_${T}`;

/**
 * Loads CAPWATCH data that can be used for unit tests
 */
export const getCAPWATCHTestData = (): Required<Pick<PresetRecords, TableForm<DBNames>>> =>
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require(resolve(__dirname, '../test-data/CAPWATCH_Test_Data.json')) as Required<
		Pick<PresetRecords, TableForm<DBNames>>
	>;

/**
 * Given CAPWATCH data, finds a member. Assumes that the member exists and throws an exception otherwise
 *
 * ORGIDs must be provided to load duty positions
 */
export const getMemberFromTestData = (
	member: CAPNHQMemberReference,
	...orgids: number[]
): CAPNHQMemberObject => {
	const data = getCAPWATCHTestData();

	const CAPID = member.id;

	const baseDetails = data.NHQ_Member.find(mem => mem.CAPID === CAPID);

	if (!baseDetails) {
		throw new Error('Invalid member!');
	}

	const dutyPositions = [
		...data.NHQ_DutyPosition.filter(row => row.CAPID === CAPID && orgids.includes(row.ORGID)),
		...data.NHQ_CadetDutyPosition.filter(
			row => row.CAPID === CAPID && orgids.includes(row.ORGID),
		),
	].map(
		(dp): ShortDutyPosition => ({
			duty: dp.Duty,
			date: +DateTime.fromISO(dp.DateMod),
			orgid: dp.ORGID,
			type: 'NHQ',
		}),
	);

	const contactRows = data.NHQ_MbrContact.filter(row => row.CAPID === CAPID);
	const contact: CAPMemberContact = {
		CADETPARENTEMAIL: {},
		CADETPARENTPHONE: {},
		CELLPHONE: {},
		EMAIL: {},
		HOMEPHONE: {},
		WORKPHONE: {},
	};

	contactRows.forEach(item => {
		const contactType = item.Type.toUpperCase().replace(/ /g, '') as CAPMemberContactType;

		if (contactType in contact) {
			contact[contactType][item.Priority] = item.Contact;
		}
	});

	return {
		absenteeInformation: null,
		contact,
		dateOfBirth: +DateTime.fromISO(baseDetails.DOB),
		dutyPositions,
		expirationDate: +DateTime.fromISO(baseDetails.Expiration),
		flight: null,
		gender: baseDetails.Gender,
		id: CAPID,
		joined: +DateTime.fromISO(baseDetails.Joined),
		memberRank: baseDetails.Rank,
		nameFirst: baseDetails.NameFirst,
		nameMiddle: baseDetails.NameMiddle,
		nameLast: baseDetails.NameLast,
		nameSuffix: baseDetails.NameSuffix,
		orgid: baseDetails.ORGID,
		seniorMember: baseDetails.Type !== 'CADET',
		squadron: `${baseDetails.Region}-${baseDetails.Wing}-${baseDetails.Unit}`,
		teamIDs: [],
		type: 'CAPNHQMember',
		usrID: baseDetails.UsrID,
	};
};

/**
 * Given a member, upgrades them to a user by giving them default squadron permissions
 */
export const getTestUserForMember = (member: Member, permissions?: MemberPermissions): User => ({
	...member,
	sessionID: '',
	permissions: permissions ?? getDefaultMemberPermissions(AccountType.CAPSQUADRON),
});
