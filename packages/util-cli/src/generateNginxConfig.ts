#!/usr/bin/env node
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { getSession } from '@mysql/xdevapi';
import 'dotenv/config';
import { CAPAccountObject, AccountObject } from 'common-lib';
import { conf } from 'server-common';
import { writeFile } from 'fs/promises';
import { join } from 'path';

process.on('unhandledRejection', up => {
	throw up;
});

const nginxHttpsConfigurationForHost = (host: string, certhost: string): string => `server {
	server_name ${host};

	root /usr/evm-plus/client;

	index index.html;

	location /api {
		proxy_pass http://main:3001;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
		proxy_request_buffering off;
		client_max_body_size 0;
	}

	location /.well-known/acme-challenge/ {
		root /var/www/certbot;
	}

	location / {
		add_header 'Access-Control-Allow-Origin' '*';
		add_header 'Vary' 'origin';
		try_files $uri /index.html;
	}

	listen 443 ssl http2;

	ssl_certificate /etc/letsencrypt/live/${certhost}/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/${certhost}/privkey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
	return 301 https://$host$request_uri;

	server_name ${host};

	listen 80;
}
`;

const nginxHttpConfigurationForHost = (host: string): string => `server {
	server_name ${host};

	location /.well-known/acme-challenge/ {
		root /var/www/certbot;
	}

	listen 80;
}
`;

void (async () => {
	const hostConfigurationFolder = process.argv[2];
	if (hostConfigurationFolder === undefined) {
		console.error('Folder not specified');
		return 1;
	}

	const baseHostName = process.argv[3] ?? 'events.md.cap.gov';

	// eslint-disable-next-line @typescript-eslint/no-implied-eval
	const typeFilter = new Function('account', `return !!(${process.argv[4] ?? 'true'})`) as (
		account: AccountObject,
	) => boolean;

	console.log('Using filter function ', process.argv[4] ?? 'true');

	const config = await conf.getCLIConfiguration();

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	try {
		const schema = session.getSchema(config.DB_SCHEMA);

		const accountCollection = schema.getCollection<CAPAccountObject>('Accounts');

		const accounts = (await accountCollection.find('true').execute()).fetchAll();

		for (const account of accounts) {
			if (!typeFilter(account)) {
				continue;
			}

			console.log('Editing config for ', account.id);

			const useSimpleConfig = process.argv[5] === 'true';

			const accountConfig = [account.id, ...account.aliases]
				.map(host =>
					(useSimpleConfig
						? nginxHttpConfigurationForHost
						: nginxHttpsConfigurationForHost)(
						`${host}.${baseHostName}`,
						`${account.id}.${baseHostName}`,
					),
				)
				.join('\n');

			await writeFile(join(hostConfigurationFolder, `${account.id}.conf`), accountConfig);
		}

		return 0;
	} finally {
		await session.close();
	}
})().then(
	code => process.exit(code),
	e => {
		console.error(e);
		process.exit(1);
	},
);
