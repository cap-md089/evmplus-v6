/**
 * Copyright (C) 2020 Andrew Rioux and Glenn Rioux
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

import { Schema, Session } from '@mysql/xdevapi';
import { spawn } from 'child_process';
import { CAPWATCHImportErrors, ValidateRuleSet, Validator } from 'common-lib';
import * as csv from 'csv-parse';
import cadetActivities from './capwatch-modules/cadetactivities';
import cadetDutyPosition from './capwatch-modules/cadetdutypositions';
import cadetAchv from './capwatch-modules/cadetachv';
import cadetAchvAprs from './capwatch-modules/cadetachvaprs';
import dutyPosition from './capwatch-modules/dutyposition';
import mbrAchievements from './capwatch-modules/mbrachievement';
import mbrContact from './capwatch-modules/mbrcontact';
import memberParse from './capwatch-modules/member';
import oFlight from './capwatch-modules/oflight';
import organization from './capwatch-modules/organization';
import cadetAchievementEnumParse from './capwatch-modules/cdtachvenum';
import cadetHFZInformationParse from './capwatch-modules/cadethfzinformation';
import { Backends, combineBackends, getTimeBackend, TimeBackend } from './backends';
import { AccountBackend, getRequestFreeAccountsBackend } from '.';
import { CAP } from './member/members';
import { getRequestFreeRegistryBackend, RegistryBackend } from './Registry';
import { RawMySQLBackend, requestlessMySQLBackend } from './MySQLUtil';
import { getRequestFreeTeamsBackend, TeamsBackend } from './Team';

export { CAPWATCHImportErrors as CAPWATCHError };

export type FileData<T> = {
	[P in keyof T]: string;
};

export const convertCAPWATCHValidator = <T extends object>(
	validator: Validator<T>,
): Validator<FileData<T>> => {
	const newRules = {} as ValidateRuleSet<FileData<T>>;

	for (const ruleName in validator.rules) {
		if (validator.rules.hasOwnProperty(ruleName)) {
			newRules[ruleName] = Validator.String;
		}
	}

	return new Validator(newRules);
};

export type CAPWATCHModule<T> = (
	backend: Backends<[RawMySQLBackend, RegistryBackend, AccountBackend, CAP.CAPMemberBackend]>,
	fileData: Array<FileData<T>>,
	schema: Schema,
	isORGIDValid: (orgid: number) => boolean,
	trustedFile: boolean,
) => Promise<CAPWATCHImportErrors>;

const modules: Array<{
	module: CAPWATCHModule<any>;
	file: string;
}> = [
	{
		module: memberParse,
		file: 'Member.txt',
	},
	{
		module: dutyPosition,
		file: 'DutyPosition.txt',
	},
	{
		module: mbrContact,
		file: 'MbrContact.txt',
	},
	{
		module: cadetDutyPosition,
		file: 'CadetDutyPositions.txt',
	},
	{
		module: cadetActivities,
		file: 'CadetActivities.txt',
	},
	{
		module: oFlight,
		file: 'OFlight.txt',
	},
	{
		module: mbrAchievements,
		file: 'MbrAchievements.txt',
	},
	{
		module: cadetAchv,
		file: 'CadetAchv.txt',
	},
	{
		module: cadetAchvAprs,
		file: 'CadetAchvAprs.txt',
	},
	{
		module: cadetAchievementEnumParse,
		file: 'CdtAchvEnum.txt',
	},
	{
		module: cadetHFZInformationParse,
		file: 'CadetHFZInformation.txt',
	},
	/*	{
		module: seniorAwards,
		file: 'SeniorAwards.txt'
	},
	{
		module: seniorLevel,
		file: 'SeniorLevel.txt'
	},
	{
		module: mbrAddresses,
		file: 'MbrAddresses.txt'
	},
	{
		module: mbrChars,
		file: 'MbrChars.txt'
	},*/
	/* the following modules need only be imported occassionally as they do not change often */
	/*	{
		module: commanders,
		file: 'Commanders.txt'
	},*/
	{
		module: organization,
		file: 'Organization.txt',
	} /*
	{
		module: orgAddresses,
		file: 'OrganizationAddresses.txt'
	},
	{
		module: orgContact,
		file: 'OrganizationContacts.txt'
	},
	{
		module: orgMeeting,
		file: 'OrganizationMeetings.txt'
	}*/,
];

interface CAPWATCHModuleResult {
	error: CAPWATCHImportErrors;
	file: string;
}

export default async function* (
	zipFileLocation: string,
	schema: Schema,
	session: Session,
	files: string[] = modules.map(mod => mod.file),
	orgidFilter?: number[],
): AsyncIterableIterator<CAPWATCHModuleResult> {
	const foundModules: { [key: string]: boolean } = {};

	for (const i of files) {
		foundModules[i] = false;
	}

	const backend = combineBackends<
		Schema,
		[
			RawMySQLBackend,
			RegistryBackend,
			AccountBackend,
			TimeBackend,
			TeamsBackend,
			CAP.CAPMemberBackend,
		]
	>(
		requestlessMySQLBackend,
		getRequestFreeRegistryBackend,
		getRequestFreeAccountsBackend,
		getTimeBackend,
		getRequestFreeTeamsBackend,
		CAP.getRequestFreeCAPMemberBackend,
	)(schema);

	let failed = false;

	for (const mod of modules) {
		if (failed) {
			await session.rollback();
			return;
		}

		if (files.indexOf(mod.file) === -1) {
			continue;
		}

		foundModules[mod.file] = true;

		const rows: any[] = [];

		const zippedFile = spawn('unzip', ['-op', zipFileLocation, mod.file]).stdout;

		const parser = csv({
			columns: true,
		});

		parser.on('readable', () => {
			let record: any;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			while ((record = parser.read())) {
				rows.push(record);
			}
		});

		const isTrustedFile = orgidFilter !== undefined;

		const isORGIDValid = (orgid: number): boolean =>
			isTrustedFile || (orgidFilter ?? []).includes(orgid);

		yield new Promise<CAPWATCHModuleResult>(res => {
			parser.on('end', () => {
				console.log('Parsing', rows.length, 'records');
				void mod
					.module(backend, rows, schema, isORGIDValid, isTrustedFile)
					.then(error => {
						if (error !== CAPWATCHImportErrors.NONE) {
							failed = true;
						}
						return error;
					})
					.then(error =>
						res({
							error,
							file: mod.file,
						}),
					);
			});

			zippedFile.pipe(parser);
		});
	}

	await session.commit();

	for (const i in foundModules) {
		if (foundModules.hasOwnProperty(i) && !foundModules[i]) {
			console.warn('Invalid file passed to ImportCAPWATCHFile:', i);
		}
	}
}
