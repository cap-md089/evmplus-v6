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
import { SigninKeyScopeType, StoredSigninKey } from 'common-lib';
import { generateKeyPairSync } from 'crypto';
import { collectResults, conf, findAndBind } from 'server-common';

process.on('unhandledRejection', up => {
	throw up;
});

void (async () => {
	const config = await conf.getCLIConfiguration();

	if (process.argv.length < 4) {
		throw new Error('Command requires an account ID and a signature ID name');
	}

	const accountID = process.argv[2];
	const signatureIDName = process.argv[3];

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	const schema = session.getSchema(config.DB_SCHEMA);

	const collection = schema.getCollection<StoredSigninKey>('SigninKeys');

	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
		modulusLength: 2048,
	});

	const signatureID = `${signatureIDName}-${accountID}.evmplus.org`;

	const results = await collectResults(findAndBind(collection, { signatureID }));

	if (results.length > 0) {
		console.error('Signature ID already used');
		process.exit();
	}

	console.error('Signature ID:', signatureID);
	console.log(privateKey.export({ format: 'pem', type: 'pkcs1' }));

	await collection
		.add({
			publicKey: publicKey.export({ format: 'pem', type: 'pkcs1' }).toString(),
			scope: {
				type: SigninKeyScopeType.ACCOUNT,
				accountID,
			},
			signatureID,
		})
		.execute();

	await session.close();

	process.exit();
})();
