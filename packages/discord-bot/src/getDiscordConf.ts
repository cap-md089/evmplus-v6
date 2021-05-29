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

import { validator } from 'auto-client-api';
import { Either, EitherObj, Validator } from 'common-lib';
import * as dotenv from 'dotenv';
import { readFile } from 'fs';
import { promisify } from 'util';

export interface EnvDiscordCLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PORT: string;
	DB_POOL_SIZE: string;

	HOST_NAME: string;
}

export interface DiscordCLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: number;
	DB_USER: string;
	DB_POOL_SIZE: number;

	HOST_NAME: string;

	DISCORD_CLIENT_TOKEN: string;
}

export interface RawDiscordCLIConfiguration {
	DB_SCHEMA: string;
	DB_HOST: string;
	DB_PASSWORD: string;
	DB_PORT: string;
	DB_USER: string;
	DB_POOL_SIZE: string;

	HOST_NAME: string;

	DISCORD_CLIENT_TOKEN: string;
}

export const parseRawConfiguration = (
	raw: RawDiscordCLIConfiguration,
): DiscordCLIConfiguration => ({
	DB_HOST: raw.DB_HOST,
	DB_PASSWORD: raw.DB_PASSWORD,
	DB_SCHEMA: raw.DB_SCHEMA,
	DB_USER: raw.DB_USER,
	DB_PORT: parseInt(raw.DB_PORT, 10),
	DB_POOL_SIZE: parseInt(raw.DB_POOL_SIZE, 10),

	HOST_NAME: raw.HOST_NAME,

	DISCORD_CLIENT_TOKEN: raw.DISCORD_CLIENT_TOKEN,
});

export const injectConfiguration = (readfile = promisify(readFile)) => async (
	conf: EnvDiscordCLIConfiguration,
): Promise<DiscordCLIConfiguration> => {
	const toUtf8 = (buf: Buffer): string => buf.toString('utf-8');

	const [DB_USER, DB_PASSWORD, DISCORD_CLIENT_TOKEN] = await Promise.all([
		readfile('/run/secrets/db_user').then(toUtf8),
		readfile('/run/secrets/db_password').then(toUtf8),
		readfile('/run/secrets/discord_client_token').then(toUtf8),
	]);

	return parseRawConfiguration({
		...conf,

		DB_USER,
		DB_PASSWORD,
		DISCORD_CLIENT_TOKEN,
	});
};

const throws = <T>(e: EitherObj<any, T>): T => {
	if (Either.isRight(e)) {
		return e.value;
	} else {
		throw e.value;
	}
};

export default async (readfile = promisify(readFile)): Promise<DiscordCLIConfiguration> => {
	dotenv.config();

	const envConfigValidator = validator<EnvDiscordCLIConfiguration>(Validator);
	const envConfiguration = throws(envConfigValidator.validate(process.env, ''));

	return await injectConfiguration(readfile)(envConfiguration);
};
