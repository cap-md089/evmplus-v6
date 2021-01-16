import * as mysql from '@mysql/xdevapi';
import { ServerConfiguration } from 'common-lib';
import { createServer } from 'net';

export const createSocketUI = (config: ServerConfiguration, mysqlConn: mysql.Client) => {
	createServer(sock => {
		sock.on('data', async dataIn => {
			const cmd = dataIn.toString('utf-8').trim();
			if (cmd === 'conf') {
				sock.write(JSON.stringify(config, null, 4) + '\n');
			} else if (cmd === 'exit') {
				sock.write('Bye\n');
				sock.end();
			} else if (cmd.startsWith('test')) {
				const target = cmd.slice(5);

				if (target === 'mysql') {
					sock.write('Trying connection...\n');
					try {
						await mysqlConn.getSession();
						sock.write('Success!\n');
					} catch (e) {
						sock.write('Failed connection!\n');
						sock.write(e.toString());
					}
				}
			} else if (cmd === 'version') {
				const { version: serverVersion } = require('../package.json');
				const { version: apiVersion } = require('apis/package.json');
				const { version: compilerVersion } = require('auto-client-api/package.json');
				const { version: clientVersion } = require('../../client/package.json');
				const { version: libVersion } = require('common-lib/package.json');
				const { version: discordBotVersion } = require('discord-bot/package.json');
				const { version: serverCommonVersion } = require('server-common/package.json');
				const { version: typescriptVersion } = require('typescript/package.json');

				sock.write(`Server version: ${serverVersion}\n`);
				sock.write(`API version: ${apiVersion}\n`);
				sock.write(`Macro version: ${compilerVersion}\n`);
				sock.write(`Client version: ${clientVersion}\n`);
				sock.write(`Common lib version: ${libVersion}\n`);
				sock.write(`Discord bot version: ${discordBotVersion}\n`);
				sock.write(`Server common version: ${serverCommonVersion}\n`);
				sock.write(`TypeScript version: ${typescriptVersion}\n`);
			} else if (cmd === 'set') {
				const [target, value] = cmd.slice(4).split(' ');
				if (!value || !target) {
					sock.write('Target and value must be set\n');
					return;
				}
				if (target === 'account') {
					process.env.DEFAULT_ACCOUNT = value;
				}
			} else {
				sock.write('Invalid command\n');
			}
		});
	}).listen(54248, '127.0.0.1');
};
