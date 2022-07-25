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
import { CAPWATCHImportErrors, Either, ValidateRuleSet, Validator } from 'common-lib';
import * as csv from 'csv-parse';
import { AccountBackend, getRequestFreeAccountsBackend } from '.';
import { Backends, combineBackends, getTimeBackend, TimeBackend } from './backends';
import cadetAchv from './capwatch-modules/cadetachv';
import cadetAchvAprs from './capwatch-modules/cadetachvaprs';
import cadetActivities from './capwatch-modules/cadetactivities';
import cadetDutyPosition from './capwatch-modules/cadetdutypositions';
import cadetHFZInformationParse from './capwatch-modules/cadethfzinformation';
import cadetAchievementEnumParse from './capwatch-modules/cdtachvenum';
import commanders from './capwatch-modules/commanders';
import dutyPosition from './capwatch-modules/dutyposition';
import mbrAchievements from './capwatch-modules/mbrachievement';
import mbrContact from './capwatch-modules/mbrcontact';
import memberParse from './capwatch-modules/member';
import oFlight from './capwatch-modules/oflight';
import organization from './capwatch-modules/organization';
import orgContact from './capwatch-modules/orgcontact';
import plGroups from './capwatch-modules/pl/groups';
import plLookup from './capwatch-modules/pl/lookup';
import plMemberPathCredit from './capwatch-modules/pl/memberPathCredit';
import plMemberTaskCredit from './capwatch-modules/pl/memberTaskCredit';
import plPaths from './capwatch-modules/pl/paths';
import plTaskGroupAssignments from './capwatch-modules/pl/taskGroupAssignments';
import plTasks from './capwatch-modules/pl/tasks';
import seniorAwards from './capwatch-modules/seniorawards';
import seniorLevel from './capwatch-modules/seniorlevel';
import { CAP } from './member/members';
import { RawMySQLBackend, requestlessMySQLBackend } from './MySQLUtil';
import { getRequestFreeRegistryBackend, RegistryBackend } from './Registry';
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

export interface CAPWATCHFileResult {
	type: 'Result';
	error: CAPWATCHImportErrors;
}

export interface CAPWATCHFileUpdateResult {
	type: 'Update';
	currentRecord: number;
}

export interface CAPWATCHFileLogResult {
	type: 'Log';
	currentRecord: number;
}

export interface CAPWATCHFilePermissionsResult {
	type: 'PermsError';
	memberName: string;
	capid: number;
}

export const badDataResult: CAPWATCHFileResult = {
	type: 'Result',
	error: CAPWATCHImportErrors.BADDATA,
};

export const isFileDataValid = <T extends object>(validator: Validator<T>) => (
	fileData: Array<FileData<T>>,
): boolean => {
	const results = fileData.map(value => validator.validate(value, '')).filter(Either.isLeft);

	if (results.length !== 0) {
		console.error('Error! Error when validating CAPWATCH file data');

		const displayCount = 3;

		console.error(results.map(({ value }) => value).slice(displayCount));

		if (results.length > displayCount) {
			console.error(`... and ${results.length - displayCount} more errors`);
		}

		return false;
	}

	return true;
};

export type CAPWATCHModule<T> = (
	backend: Backends<[RawMySQLBackend, RegistryBackend, AccountBackend, CAP.CAPMemberBackend]>,
	fileData: Array<FileData<T>>,
	schema: Schema,
	isORGIDValid: (orgid: number) => boolean,
	trustedFile: boolean,
	capidMap: { [CAPID: number]: number },
	files: string[],
) => AsyncIterableIterator<
	| CAPWATCHFileUpdateResult
	| CAPWATCHFileLogResult
	| CAPWATCHFileResult
	| CAPWATCHFilePermissionsResult
>;

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
	{
		module: seniorAwards,
		file: 'SeniorAwards.txt',
	},
	{
		module: seniorLevel,
		file: 'SeniorLevel.txt',
	},
	/*  {
		module: mbrAddresses,
		file: 'MbrAddresses.txt'
	},
	{
		module: mbrChars,
		file: 'MbrChars.txt'
	},*/
	/* the following modules need only be imported occassionally as they do not change often */
	{
		module: commanders,
		file: 'Commanders.txt',
	},
	{
		module: organization,
		file: 'Organization.txt',
	},
	{
		module: orgContact,
		file: 'OrgContact.txt',
	} /*
	{
		module: orgAddresses,
		file: 'OrganizationAddresses.txt'
	},
	{
		module: orgMeeting,
		file: 'OrganizationMeetings.txt'
	}*/,
	{
		module: plGroups,
		file: 'PL_Groups.txt',
	},
	{
		module: plLookup,
		file: 'PL_Lookup.txt',
	},
	{
		module: plMemberPathCredit,
		file: 'PL_MemberPathCredit.txt',
	},
	{
		module: plMemberTaskCredit,
		file: 'PL_MemberTaskCredit.txt',
	},
	{
		module: plPaths,
		file: 'PL_Paths.txt',
	},
	{
		module: plTaskGroupAssignments,
		file: 'PL_TaskGroupAssignments.txt',
	},
	{
		module: plTasks,
		file: 'PL_Tasks.txt',
	},
];

export interface CAPWATCHModuleResult {
	type: 'Result';
	error: CAPWATCHImportErrors;
	file: string;
}

export interface CAPWATCHFileUpdate {
	type: 'Update';
	recordCount: number;
	currentRecord: number;
}

export interface CAPWATCHFileMemberImportError {
	type: 'PermsError';
	capid: number;
	memberName: string;
}

export type CAPWATCHUpdateOrResult =
	| CAPWATCHModuleResult
	| CAPWATCHFileLogResult
	| CAPWATCHFileUpdate
	| CAPWATCHFileMemberImportError;

export const defaultFiles: string[] = modules.map(mod => mod.file);

export default async function* (
	zipFileLocation: string,
	schema: Schema,
	session: Session,
	files: string[] = defaultFiles,
	orgidFilter: number[] = [],
): AsyncIterableIterator<CAPWATCHUpdateOrResult> {
	const foundModules: { [key: string]: boolean } = {};

	// Always import Member.txt first, so that it can set which CAPID belongs to which ORGID
	// The Member.txt module impurely updates an object to allow for quick checking of CAPIDs vs ORGIDs
	const usedFiles = ['Member.txt', ...files.filter(file => file !== 'Member.txt')];

	for (const i of usedFiles) {
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

	const capidMap: { [CAPID: number]: number } = {};

	for (const mod of modules) {
		if (usedFiles.indexOf(mod.file) === -1) {
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

		const isTrustedFile = orgidFilter.length === 0;

		const isORGIDValid = (orgid: number): boolean =>
			isTrustedFile || orgidFilter.includes(orgid);

		const records = await new Promise<any[]>(res => {
			parser.on('end', () => {
				console.log('Parsing', rows.length, 'records -- one dot = 15 records');
				res(rows);
			});

			zippedFile.pipe(parser);
		});

		for await (const result of mod.module(
			backend,
			records,
			schema,
			isORGIDValid,
			isTrustedFile,
			capidMap,
			usedFiles,
		)) {
			if (result.type === 'Result') {
				if (result.error !== CAPWATCHImportErrors.NONE) {
					await session.rollback();

					return yield {
						...result,
						file: mod.file,
					};
				}
				yield {
					...result,
					file: mod.file,
				};
			} else if (result.type === 'PermsError') {
				await session.rollback();

				return yield result;
			} else if (result.type === 'Log') {
				yield {
					...result,
				};
			} else {
				yield {
					...result,
					recordCount: records.length,
				};
			}
		}
	}

	await session.commit();

	for (const i in foundModules) {
		if (foundModules.hasOwnProperty(i) && !foundModules[i]) {
			console.warn('Invalid file passed to ImportCAPWATCHFile:', i);
		}
	}
}
