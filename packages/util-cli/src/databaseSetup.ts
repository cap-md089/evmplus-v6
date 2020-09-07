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
import { Either, RawServerConfiguration, Validator } from 'common-lib';
import 'dotenv/config';
import { confFromRaw } from 'server-common';

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
	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	// @ts-ignore
	const schema = session.getSchema(conf.DB_SCHEMA);

	await Promise.all([
		schema.createCollection('Accounts'),
		schema.createCollection('Attendance'),
		schema.createCollection('Audits'),
		schema.createCollection('DiscordAccounts'),
		schema.createCollection('Errors'),
		schema.createCollection('Events'),
		schema.createCollection('ExtraAccountMembership'),
		schema.createCollection('ExtraMemberInformation'),
		schema.createCollection('Files'),
		schema.createCollection('MemberSessions'),
		schema.createCollection('NHQ_CadetActivities'),
		schema.createCollection('NHQ_CadetDutyPosition'),
		schema.createCollection('NHQ_DutyPosition'),
		schema.createCollection('NHQ_MbrAchievements'),
		schema.createCollection('NHQ_MbrContact'),
		schema.createCollection('NHQ_Member'),
		schema.createCollection('NHQ_OFlight'),
		schema.createCollection('NHQ_Organization'),
		schema.createCollection('Notifications'),
		schema.createCollection('PasswordResetTokens'),
		schema.createCollection('ProspectiveMembers'),
		schema.createCollection('Registry'),
		schema.createCollection('Sessions'),
		schema.createCollection('Tasks'),
		schema.createCollection('Teams'),
		schema.createCollection('Tokens'),
		schema.createCollection('UserAccountInfo'),
		schema.createCollection('UserAccountTokens'),
		schema.createCollection('UserPermissions'),
	]);

	process.exit();
})();
