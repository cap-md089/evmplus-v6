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

import {
	always,
	Either,
	EitherObj,
	EnvServerConfiguration,
	RawServerConfiguration,
	ServerConfiguration,
	Validator,
} from 'common-lib';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import { validator } from 'auto-client-api';

export const parseRawConfiguration = (raw: RawServerConfiguration): ServerConfiguration => ({
	CAPWATCH_DOWNLOAD_PATH: raw.CAPWATCH_DOWNLOAD_PATH,
	CLIENT_PATH: raw.CLIENT_PATH,
	GOOGLE_KEYS_PATH: raw.GOOGLE_KEYS_PATH,

	DB_HOST: raw.DB_HOST,
	DB_PASSWORD: raw.DB_PASSWORD,
	DB_SCHEMA: raw.DB_SCHEMA,
	DB_USER: raw.DB_USER,
	DB_PORT: parseInt(raw.DB_PORT, 10),
	DB_POOL_SIZE: parseInt(raw.DB_POOL_SIZE, 10),

	NODE_ENV: raw.NODE_ENV,
	PORT: parseInt(raw.PORT, 10),

	DISCORD_CLIENT_TOKEN: raw.DISCORD_CLIENT_TOKEN,

	DRIVE_STORAGE_PATH: raw.DRIVE_STORAGE_PATH,

	HOST_NAME: raw.HOST_NAME,

	AWS_ACCESS_KEY_ID: raw.AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY: raw.AWS_SECRET_ACCESS_KEY,

	RECAPTCHA_SECRET: raw.RECAPTCHA_SECRET,
});

export const injectConfiguration = (readfile = promisify(readFile)) => async (
	conf: EnvServerConfiguration,
): Promise<ServerConfiguration> => {
	const toUtf8 = (buf: Buffer) => buf.toString('utf-8');

	const [
		DB_PASSWORD,
		DISCORD_CLIENT_TOKEN,
		AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY,
		RECAPTCHA_SECRET,
	] = await Promise.all([
		readfile('/run/secrets/db_password').then(toUtf8),
		readfile('/run/secrets/discord_client_token').then(toUtf8, always(void 0)),
		readfile('/run/secrets/aws_access_key_id').then(toUtf8),
		readfile('/run/secrets/aws_secret_access_key').then(toUtf8),
		readfile('/run/secrets/recaptcha_secret').then(toUtf8),
	]);

	return parseRawConfiguration({
		...conf,

		DB_PASSWORD,
		DISCORD_CLIENT_TOKEN,
		AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY,

		RECAPTCHA_SECRET,
	});
};

const throws = <T>(e: EitherObj<any, T>): T => {
	if (Either.isRight(e)) {
		return e.value;
	} else {
		throw e.value;
	}
};

export default async (readfile = promisify(readFile)) => {
	dotenv.config();

	const envConfigValidator = validator<EnvServerConfiguration>(Validator);
	const envConfiguration = throws(envConfigValidator.validate(process.env, ''));

	return await injectConfiguration(readfile)(envConfiguration);
};
