#!/usr/bin/env node
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

import { getSession } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import {
	Either,
	RawServerConfiguration,
	SigninKeyScopeType,
	StoredSigninKey,
	Validator,
} from 'common-lib';
import 'dotenv/config';
import { collectResults, confFromRaw, findAndBind } from 'server-common';
import { generateKeyPairSync } from 'crypto';

const configurationValidator = validator<RawServerConfiguration>(Validator);

const confEither = Either.map(confFromRaw)(configurationValidator.validate(process.env, ''));

if (Either.isLeft(confEither)) {
	console.error('Configuration error!', confEither.value);
	process.exit(1);
}

const conf = confEither.value;

process.on('unhandledRejection', up => {
	throw up;
});

(async () => {
	if (process.argv.length < 4) {
		throw new Error('Command requires an account ID and a signature ID name');
	}

	const accountID = process.argv[2];
	const signatureIDName = process.argv[3];

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	const schema = session.getSchema(conf.DB_SCHEMA);

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
