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

import { Client, getClient, Schema, Session } from '@mysql/xdevapi';
import * as Docker from 'dockerode';

const dockerConn = new Docker({
	socketPath: '/var/run/docker.sock',
});

interface ConnectionInfo {
	dockerContainer: Docker.Container;
	mysqlClient: Client;
}

const randomId = () =>
	Math.random()
		.toString(36)
		.substring(2, 15) +
	Math.random()
		.toString(36)
		.substring(2, 15);

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

	public static async setup() {
		return (this.currentConnection = await (this.currentConnection = (async () => {
			await dockerConn.pull('mysql:8.0');

			const password = randomId();

			const dockerContainer = await dockerConn.createContainer({
				Image: 'mysql:8.0',

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
		if (this.currentConnection instanceof Promise) {
			const connInfo = await this.currentConnection;

			const schema = randomId();
			const session = await connInfo.mysqlClient.getSession();
			await session.createSchema(schema);

			return new TestConnection(connInfo.mysqlClient, session, schema);
		} else if (this.currentConnection) {
			const schema = randomId();
			const session = await this.currentConnection.mysqlClient.getSession();
			await session.createSchema(schema);

			return new TestConnection(this.currentConnection.mysqlClient, session, schema);
		} else {
			const connInfo = await this.setup();

			const schema = randomId();
			const session = await connInfo.mysqlClient.getSession();
			await session.createSchema(schema);

			return new TestConnection(connInfo.mysqlClient, session, schema);
		}
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
		if (!this.mysqlInfo) {
			return;
		}
		const { host, port, user, pass } = this.mysqlInfo;
		return `mysqlx://${user}:${pass}@${host}:${port}`;
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
		await this.session.sql(`USE ${this.schema};`).execute();

		await Promise.all(COLLECTIONS_USED.map(createCollection(this.getSchema())));
	}
}

TestConnection.setup = TestConnection.setup.bind(TestConnection);
TestConnection.setupSchema = TestConnection.setupSchema.bind(TestConnection);
TestConnection.teardown = TestConnection.teardown.bind(TestConnection);

export default TestConnection;
