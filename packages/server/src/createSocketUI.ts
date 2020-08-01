import * as mysql from '@mysql/xdevapi';
import { ServerConfiguration } from 'common-lib';
import { readFile } from 'fs';
import { createServer } from 'net';
import * as Client from 'ssh2-sftp-client';
import { promisify } from 'util';

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
				} else if (target === 'sftp') {
					sock.write('Trying connection...\n');
					const sftp = new Client();

					let privateKey;

					const {
						REMOTE_DRIVE_HOST: host,
						REMOTE_DRIVE_PORT: port,
						REMOTE_DRIVE_USER: username
					} = config;

					try {
						privateKey = await promisify(readFile)(config.REMOTE_DRIVE_KEY_FILE);
					} catch (e) {
						sock.write('Error reading key!\n');
						sock.write(e.message + '\n');
						return;
					}

					try {
						await sftp.connect({
							host,
							port,
							username,
							privateKey
						});

						const files = await sftp.list(config.REMOTE_DRIVE_STORAGE_PATH);

						await sftp.end();

						sock.write(`Found ${files.length} files.`);
					} catch (e) {
						sock.write('SFTP error!');
						sock.write(e.message);
					}
				}
			} else {
				sock.write('Invalid command\n');
			}
		});
	}).listen(54248, '127.0.0.1');
};
