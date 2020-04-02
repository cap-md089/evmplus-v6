import { getSession } from '@mysql/xdevapi';
import { maybe, MemberUpdateEventEmitter, renderAccountID, ServerConfiguration } from 'common-lib';
import { Client } from 'discord.js';
import getAccount from './data/getAccount';
import getDiscordAccount from './data/getDiscordAccount';
import setupUser from './data/setupUser';

export const getCertName = (name: string) => name.split('-')[0].trim();

const getXSession = async ({ database: { connection } }: ServerConfiguration) => {
	const { host, password, port, user } = connection;

	const session = await getSession({
		host,
		password,
		port,
		user
	});

	return { session, schema: session.getSchema(connection.database) };
};

export default function setup(
	conf: ServerConfiguration,
	capwatchEmitter: MemberUpdateEventEmitter
) {
	const client = new Client();

	const userSetupFunction = setupUser(client);

	capwatchEmitter.on('capwatchImport', async accountObj => {
		const { schema, session } = await getXSession(conf);

		const discordServer = maybe(accountObj.discordServer);

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		const setupForAccount = guildUserSetup(account.value);

		console.log('Applying CAPWATCH to Discord');

		for await (const member of account.value.getMembers()) {
			const userAccount = await getDiscordAccount(schema)(member.getReference());

			if (!userAccount.hasValue) {
				continue;
			}

			await setupForAccount(userAccount.value);
		}

		console.log('Done applying CAPWATCH to Discord');

		await session.close();
	});

	capwatchEmitter.on('discordRegister', async ({ user, account: accountObj }) => {
		const { schema, session } = await getXSession(conf);

		const discordServer = maybe(accountObj.discordServer);

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		await guildUserSetup(account.value)(user);

		await session.close();
	});

	capwatchEmitter.on('memberChange', async ({ member, account: accountObj }) => {
		const { schema, session } = await getXSession(conf);

		console.log('Changing member information for', member);

		const discordServer = maybe(accountObj.discordServer);

		if (!discordServer.hasValue) {
			return;
		}

		const guildUserSetup = userSetupFunction(schema)(discordServer.value.serverID);
		const account = await getAccount(schema)(discordServer.value.serverID);

		if (!account.hasValue) {
			return;
		}

		const userAccount = await getDiscordAccount(schema)(member);

		if (!userAccount.hasValue) {
			return;
		}

		await guildUserSetup(account.value)(userAccount.value);

		await session.close();
	});

	client.on('ready', async () => {
		console.log('Bot ready');
		// Server: 437034622090477568
		// James: 480450468632592386
		// James: { type: 'CAPNHQMember', id: 584478 }
		// Wilson: 463106004369014830
		// Wilson: { type: 'CAPNHQMember', id: 599814 }

		// const schema = await getSchema(conf);
		// const setupUserInSchema = userSetupFunction(schema)('437034622090477568');

		// console.log('Got schema');

		// const guild = client.guilds.get('437034622090477568');

		// await guild?.fetchMembers();

		// const user = guild?.members.get('480450468632592386');

		// console.log(user?.nickname);

		// const account = await getAccount(schema)('437034622090477568');

		// if (!account.hasValue) {
		// 	return;
		// }

		// console.log('Got account');

		// const setupUserInAccount = setupUserInSchema(account.value);

		// console.log('Fixing user accounts');

		// const accounts = await collectResults(
		// 	schema.getCollection<DiscordAccount>('DiscordAccounts').find('true')
		// );

		// for (const account of accounts) {
		// 	await setupUserInAccount(account);
		// }

		// console.log('Finished');

		/*
		try {
			await setupUserInAccount({
				discordID: '463106004369014830',
				member: { type: 'CAPNHQMember', id: 599814 }
			});
		} catch (e) {
			// ignore
		}

		await client.destroy();

		process.exit(1);*/
	});

	client.on('guildMemberAdd', async member => {
		const { schema, session } = await getXSession(conf);
		const account = await getAccount(schema)(member.guild.id);

		if (!account.hasValue) {
			return;
		}

		const dmChannel = await member.createDM();

		dmChannel.send(
			`Welcome to the CAP ${renderAccountID(
				account.value
			)} Discord server. Please go to the following page on your squadron's website to finish account setup: https://${
				account.value.id
			}.capunit.com/signin/?returnurl=/registerdiscord/${member.id}`
		);

		await session.close();
	});

	client.login('NTcyNTM2NjA2NTczOTg1Nzk0.XoNX_w.DqZBylJMuce9tQP3UWeDasw5lpc');
}

if (require.main === module) {
	// new Promise((res, rej) => {
	// 	const client = new Client();

	// 	const config = {
	// 		production: false,
	// 		testing: false,
	// 		clientStorage: join(__dirname, '..', '..', 'client'),
	// 		database: {
	// 			connection: {
	// 				database: 'EventManagement4',
	// 				host: '127.0.0.1',
	// 				password: 'alongpassword2017',
	// 				port: 33060,
	// 				user: 'em'
	// 			},
	// 			connectionCount: 15
	// 		},
	// 		fileStoragePath: '/uploads',
	// 		capwatchFileDownloadDirectory: '/capwatch-zips',
	// 		googleKeysPath: '/google-keys',
	// 		path: __dirname,
	// 		port: 3001
	// 	};

	// 	client.on('ready', async () => {
	// 		try {
	// 			const { schema, session } = await getXSession(config);

	// 			const guild = client.guilds.get('437034622090477568');

	// 			// const byColor = (arr: [number, number, number]) => (role: Role) =>

	// 			// for (const cert of certifications) {
	// 			// 	await guild?.createRole({
	// 			// 		name: getCertName(cert[1]),
	// 			// 		hoist: false,
	// 			// 		color: [113, 54, 138],
	// 			// 		mentionable: false,
	// 			// 		permissions: new Permissions(Permissions.DEFAULT).remove(
	// 			// 			Permissions.FLAGS.CREATE_INSTANT_INVITE!
	// 			// 		),
	// 			// 		position: 7
	// 			// 	});
	// 			// }

	// 			await session.close();
	// 			await client.destroy();

	// 			res();
	// 		} catch (e) {
	// 			rej(e);
	// 		}
	// 	});

	// 	// client.login('NTcyNTM2NjA2NTczOTg1Nzk0.XoNX_w.DqZBylJMuce9tQP3UWeDasw5lpc');
	// }).then(
	// 	() => process.exit(1),
	// 	err => {
	// 		console.error(err);
	// 		process.exit(1);
	// 	}
	// );
	const certificationsCSV = ``;
	const certifications: [string, string][] = certificationsCSV
		.split('\n')
		.map(row => row.split(',').map(item => item.slice(1, item.length - 1)))
		.map(row => [row[0], getCertName(row[1])]);

	console.log(JSON.stringify(certifications.map(i => i[1])));
	console.log(JSON.stringify(Object.fromEntries(certifications)));
}
