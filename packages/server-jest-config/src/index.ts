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
import { memoize, TableDataType, TableNames } from 'common-lib';
import * as Docker from 'dockerode';

const getDockerConn = memoize(
	(a?: undefined) =>
		new Docker({
			socketPath: '/var/run/docker.sock',
		}),
);

const randomId = () =>
	Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
	'MFASetup',
	'MFATokens',
	'MemberSessions',
	'NHQ_CadetAchv',
	'NHQ_CadetAchvAprs',
	'NHQ_CadetActivities',
	'NHQ_CadetDutyPosition',
	'NHQ_CadetHFZInformation',
	'NHQ_CdtAchvEnum',
	'NHQ_DutyPosition',
	'NHQ_MbrAchievements',
	'NHQ_MbrContact',
	'NHQ_Member',
	'NHQ_OFlight',
	'NHQ_Organization',
	'Notifications',
	'PasswordResetTokens',
	'ProspectiveMembers',
	'Registry',
	'Sessions',
	'SignInLog',
	'SignatureNonces',
	'SigninKeys',
	'SigninTokens',
	'Tasks',
	'Teams',
	'Tokens',
	'UserAccountInfo',
	'UserAccountTokens',
	'UserPermissions',
];

export class TestConnection {
	public static setup(dbRef: DatabaseRef) {
		return async (done?: () => void) => {
			const connString = this.mysqlConnectionString;

			while (true) {
				try {
					const conn = await getSession(connString);
					await conn.close();

					break;
				} catch (e) {
					await new Promise<void>(res => setTimeout(res, 1000));
				}
			}
			dbRef.connection = await this.setupSchema();
			done?.();
		};
	}

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

	public static teardown(dbRef: DatabaseRef) {
		return async (done?: () => void) => {
			await dbRef.connection.session.dropSchema(dbRef.connection.schema);
			await Promise.all([dbRef.connection.client.close(), dbRef.connection.session.close()]);

			done?.();
		};
	}

	public static get mysqlConnectionString() {
		return 'mysqlx://root:toor@test-mysql:33060';
	}

	protected constructor(
		public readonly client: Client,
		public readonly session: Session,
		public readonly schema: string,
	) {}

	public getSchema() {
		return this.session.getSchema(this.schema);
	}

	public getNewSession() {
		return this.client.getSession();
	}

	private static async setupCollections(schema: string) {
		const dockerConn = getDockerConn(void 0);

		const container = dockerConn.getContainer('evmplus_test-mysql');

		const exec = await container.exec({
			Cmd: ['sh', 'setup-schema.sh', schema],
			Tty: true,
			AttachStdout: false,
			AttachStderr: false,
			AttachStdin: false,
			Env: [],
			WorkingDir: '/usr/evm-plus/packages/server-jest-config/mysql-configuration',
		});

		const stream = await exec.start({});

		container.modem.demuxStream(stream, process.stdout, process.stderr);

		await new Promise(resolve => {
			stream.on('end', resolve);
		});

		await exec.inspect();

		const session = await getSession('mysqlx://root:toor@test-mysql:33060');

		let collections;

		do {
			if (collections) {
				await new Promise(res => setTimeout(res, 500));
			}
			collections = await session.getSchema(schema).getCollections();
		} while (collections.length !== COLLECTIONS_USED.length);

		await session.close();
	}
}

TestConnection.setup = TestConnection.setup.bind(TestConnection);
// @ts-ignore
TestConnection.setupSchema = TestConnection.setupSchema.bind(TestConnection);
TestConnection.teardown = TestConnection.teardown.bind(TestConnection);

export default TestConnection;

export { default as getConf } from './conf';

export interface DatabaseRef {
	connection: TestConnection;
}

export const getDbRef = (): DatabaseRef => ({
	connection: null!,
});

export type PresetRecords = {
	[key in TableNames]?: TableDataType<key>[];
};

export const addPresetRecords = (schema: Schema) => async (map: PresetRecords) => {
	for (const tableName in map) {
		if (map.hasOwnProperty(tableName)) {
			const table = tableName as TableNames;

			const records = map[table];

			if (!records || records.length === 0) continue;

			let adder = schema.getCollection(table).add(records[0]);

			for (const record of records.slice(1)) {
				adder = adder.add(record);
			}

			await adder.execute();
		}
	}
};

export const setPresetRecords = (records: PresetRecords) => (ref: DatabaseRef) => async (
	done?: () => void,
) => {
	await Promise.all(
		COLLECTIONS_USED.map(name =>
			ref.connection.getSchema().getCollection(name).remove('true').execute(),
		),
	);

	await addPresetRecords(ref.connection.getSchema())(records);

	done?.();
};
