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
import { memoize } from 'common-lib';
import * as Docker from 'dockerode';

const getDockerConn = memoize(
	(a?: undefined) =>
		new Docker({
			socketPath: '/var/run/docker.sock',
		}),
);

interface ConnectionInfo {
	dockerContainer: Docker.Container;
	mysqlClient: Client;
}

const randomId = () =>
	Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const createCollection = (schema: Schema) => (name: string) => schema.createCollection(name);

export const COLLECTIONS_USED: readonly string[] = [
	'Accounts',
	'Attendance',
	'Audits',
	'ChangeEvents',
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
	protected static currentConnection: ConnectionInfo | Promise<ConnectionInfo> | undefined;
	protected static connections: TestConnection[] = [];
	protected static mysqlInfo?: {
		host: string;
		port: string;
		pass: string;
		user: 'root';
	};
	protected static currentComposeConnection: Client | undefined;

	public static async setup() {
		if (!process.env.IN_DOCKER_TEST_ENVIRONMENT) {
			await this._setup();
		} else {
			const connString = this.mysqlConnectionString!;

			while (true) {
				try {
					const conn = await getSession(connString);
					await conn.close();

					break;
				} catch (e) {
					await new Promise<void>(res => setTimeout(res, 1000));
				}
			}
		}
	}

	protected static async _setup() {
		return (this.currentConnection = await (this.currentConnection = (async () => {
			await getDockerConn(void 0).pull('mysql:8.0.19');

			const password = randomId();

			const dockerContainer = await getDockerConn(void 0).createContainer({
				Image: 'mysql:8.0.19',

				Tty: true,
				AttachStderr: true,
				AttachStdout: true,
				AttachStdin: false,
				OpenStdin: false,
				StdinOnce: false,

				Env: [`MYSQL_ROOT_PASSWORD=${password}`],
				HostConfig: {
					PortBindings: {
						'33060/tcp': [{ HostPort: '0' }],
					},
					Tmpfs: {
						'/var/lib/mysql': 'rw,noexec',
					},
				},
			});

			await dockerContainer.start();

			const containerInfo = (await dockerContainer.inspect()).NetworkSettings;
			const networkSettings = containerInfo as Required<typeof containerInfo>;

			const {
				HostIp,
				HostPort,
			}: { HostIp: string; HostPort: string } = networkSettings.Ports['33060/tcp'][0];

			TestConnection.mysqlInfo = {
				host: HostIp === '0.0.0.0' ? '127.0.0.1' : HostIp || '127.0.0.1',
				port: HostPort,
				pass: password,
				user: 'root',
			};

			const mysqlClient = getClient(this.mysqlConnectionString!, {
				pooling: {
					enabled: true,
					maxSize: 50,
				},
			});

			while (true) {
				try {
					await mysqlClient.getSession();
					break;
				} catch (e) {
					await new Promise(resolve => setTimeout(resolve, 5000));
				}
			}

			return {
				dockerContainer,
				mysqlClient,
			};
		})()));
	}

	public static async setupSchema(): Promise<TestConnection> {
		const schema = randomId();
		let session: Session;
		let client: Client;

		if (process.env.IN_DOCKER_TEST_ENVIRONMENT) {
			client = this.currentComposeConnection ??= getClient(this.mysqlConnectionString!, {
				pooling: {
					enabled: true,
					maxSize: 50,
				},
			});

			session = await this.currentComposeConnection.getSession();
		} else if (this.currentConnection instanceof Promise) {
			const connInfo = await this.currentConnection;

			session = await connInfo.mysqlClient.getSession();
			client = connInfo.mysqlClient;
		} else if (this.currentConnection) {
			session = await this.currentConnection.mysqlClient.getSession();
			client = this.currentConnection.mysqlClient;
		} else {
			const connInfo = await this._setup()!;

			session = await connInfo.mysqlClient.getSession();
			client = connInfo.mysqlClient;
		}

		await session.createSchema(schema);
		const connection = new TestConnection(client, session, schema);
		await connection.setupCollections();
		return connection;
	}

	public static async teardown() {
		await Promise.all(this.connections.map(conn => conn.session.close()));

		const info = await this.currentConnection;

		if (info) {
			await Promise.all([
				(async () => {
					await info.dockerContainer.stop();
					await info.dockerContainer.remove();
				})(),
				info.mysqlClient.close(),
			]);
		}
	}

	protected static get mysqlConnectionString() {
		if (process.env.IN_DOCKER_TEST_ENVIRONMENT) {
			return 'mysqlx://root:toor@test-mysql:33060';
		} else {
			if (!this.mysqlInfo) {
				return;
			}
			const { host, port, user, pass } = this.mysqlInfo;
			return `mysqlx://${user}:${pass}@${host}:${port}`;
		}
	}

	protected constructor(
		public readonly client: Client,
		public readonly session: Session,
		public readonly schema: string,
	) {
		TestConnection.connections.push(this);
	}

	public getSchema() {
		return this.session.getSchema(this.schema);
	}

	public getNewSession() {
		return this.client.getSession();
	}

	public async setupCollections() {
		await Promise.all(COLLECTIONS_USED.map(createCollection(this.getSchema())));
	}
}

TestConnection.setup = TestConnection.setup.bind(TestConnection);
// @ts-ignore
TestConnection._setup = TestConnection._setup.bind(TestConnection);
TestConnection.setupSchema = TestConnection.setupSchema.bind(TestConnection);
TestConnection.teardown = TestConnection.teardown.bind(TestConnection);

export default TestConnection;

export { default as getConf } from './conf';
