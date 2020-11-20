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

import { RawServerConfiguration, ServerConfiguration } from 'common-lib';

export default (raw: RawServerConfiguration): ServerConfiguration =>
	raw.DRIVE_TYPE === 'Local'
		? ({
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

				DRIVE_TYPE: 'Local',
				DRIVE_STORAGE_PATH: raw.DRIVE_STORAGE_PATH,

				HOST_NAME: raw.HOST_NAME,

				AWS_ACCESS_KEY_ID: raw.AWS_ACCESS_KEY_ID,
				AWS_SECRET_ACCESS_KEY: raw.AWS_SECRET_ACCESS_KEY,

				RECAPTCHA_SECRET: raw.RECAPTCHA_SECRET,
		  } as const)
		: ({
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

				DRIVE_TYPE: 'Remote',
				REMOTE_DRIVE_STORAGE_PATH: raw.REMOTE_DRIVE_STORAGE_PATH,
				REMOTE_DRIVE_HOST: raw.REMOTE_DRIVE_HOST,
				REMOTE_DRIVE_KEY_FILE: raw.REMOTE_DRIVE_KEY_FILE,
				REMOTE_DRIVE_PORT: parseInt(raw.REMOTE_DRIVE_PORT, 10),
				REMOTE_DRIVE_USER: raw.REMOTE_DRIVE_USER,

				HOST_NAME: raw.HOST_NAME,

				AWS_ACCESS_KEY_ID: raw.AWS_ACCESS_KEY_ID,
				AWS_SECRET_ACCESS_KEY: raw.AWS_SECRET_ACCESS_KEY,

				RECAPTCHA_SECRET: raw.RECAPTCHA_SECRET,
		  } as const);
