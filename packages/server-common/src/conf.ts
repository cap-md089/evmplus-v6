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
	EnvCLIConfiguration,
	RawCLIConfiguration,
	CLIConfiguration,
	Validator,
} from 'common-lib';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as dotenv from 'dotenv';
import { validator } from 'auto-client-api';

export const parseRawConfiguration = (raw: RawServerConfiguration): ServerConfiguration => ({
	GOOGLE_KEYS_PATH: raw.GOOGLE_KEYS_PATH.trim(),

	DB_HOST: raw.DB_HOST.trim(),
	DB_PASSWORD: raw.DB_PASSWORD.trim(),
	DB_SCHEMA: raw.DB_SCHEMA.trim(),
	DB_USER: raw.DB_USER.trim(),
	DB_PORT: parseInt(raw.DB_PORT, 10),
	DB_POOL_SIZE: parseInt(raw.DB_POOL_SIZE, 10),

	NODE_ENV: raw.NODE_ENV.trim(),
	PORT: parseInt(raw.PORT, 10),

	DISCORD_CLIENT_TOKEN: raw.DISCORD_CLIENT_TOKEN?.trim?.(),

	DRIVE_STORAGE_PATH: raw.DRIVE_STORAGE_PATH.trim(),

	HOST_NAME: raw.HOST_NAME.trim(),

	AWS_ACCESS_KEY_ID: raw.AWS_ACCESS_KEY_ID.trim(),
	AWS_SECRET_ACCESS_KEY: raw.AWS_SECRET_ACCESS_KEY.trim(),

	RECAPTCHA_SECRET: raw.RECAPTCHA_SECRET.trim(),
});

export const injectConfiguration = (readfile = promisify(readFile)) => async (
	conf: EnvServerConfiguration,
): Promise<ServerConfiguration> => {
	const toUtf8 = (buf: Buffer): string => buf.toString('utf-8');

	const [
		DB_USER,
		DB_PASSWORD,
		DISCORD_CLIENT_TOKEN,
		AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY,
		RECAPTCHA_SECRET,
	] = await Promise.all([
		readfile('/run/secrets/db_user').then(toUtf8),
		readfile('/run/secrets/db_password').then(toUtf8),
		readfile('/run/secrets/discord_client_token').then(toUtf8, always(void 0)),
		readfile('/run/secrets/aws_access_key_id').then(toUtf8),
		readfile('/run/secrets/aws_secret_access_key').then(toUtf8),
		readfile('/run/secrets/recaptcha_secret').then(toUtf8),
	]);

	return parseRawConfiguration({
		...conf,

		DB_USER,
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

export const getConf = async (readfile = promisify(readFile)): Promise<ServerConfiguration> => {
	dotenv.config();

	const envConfigValidator = validator<EnvServerConfiguration>(Validator);
	const envConfiguration = throws(envConfigValidator.validate(process.env, ''));

	return await injectConfiguration(readfile)(envConfiguration);
};

export const parseCLIConfiguration = (raw: RawCLIConfiguration): CLIConfiguration => ({
	GOOGLE_KEYS_PATH: raw.GOOGLE_KEYS_PATH.trim(),

	DB_HOST: raw.DB_HOST.trim(),
	DB_PASSWORD: raw.DB_PASSWORD.trim(),
	DB_SCHEMA: raw.DB_SCHEMA.trim(),
	DB_USER: raw.DB_USER.trim(),
	DB_PORT: parseInt(raw.DB_PORT, 10),
	DB_POOL_SIZE: parseInt(raw.DB_POOL_SIZE, 10),

	NODE_ENV: raw.NODE_ENV.trim(),

	DISCORD_CLIENT_TOKEN: raw.DISCORD_CLIENT_TOKEN?.trim?.(),

	DRIVE_STORAGE_PATH: raw.DRIVE_STORAGE_PATH.trim(),
});

export const getCLIConfiguration = async (
	readfile = promisify(readFile),
): Promise<CLIConfiguration> => {
	dotenv.config();

	const envConfigValidator = validator<EnvCLIConfiguration>(Validator);
	const envConfiguration = throws(envConfigValidator.validate(process.env, ''));

	const toUtf8 = (buf: Buffer): string => buf.toString('utf-8');

	const [DB_USER, DB_PASSWORD, DISCORD_CLIENT_TOKEN] = await Promise.all([
		readfile('/run/secrets/db_user').then(toUtf8),
		readfile('/run/secrets/db_password').then(toUtf8),
		readfile('/run/secrets/discord_client_token').then(toUtf8, always(void 0)),
	]);

	return parseCLIConfiguration({
		...envConfiguration,

		DB_USER,
		DB_PASSWORD,
		DISCORD_CLIENT_TOKEN,
	});
};
