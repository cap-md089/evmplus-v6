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
<<<<<<< Updated upstream
import { CAPWATCHImportErrors } from 'common-lib';
=======
import { CAPWATCHError, CAPWATCHImportErrors, Either, ValidateRuleSet, Validator } from 'common-lib';
>>>>>>> Stashed changes
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

export { CAPWATCHImportErrors as CAPWATCHError };

type FileData<T> = {
	[P in keyof T]: string;
};

<<<<<<< Updated upstream
=======
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

export const badDataResult: CAPWATCHFileResult = {
	type: 'Result',
	error: CAPWATCHError.BADDATA,
};

export const isFileDataValid = <T>(validator: Validator<T>) => (fileData: Array<FileData<T>>): boolean => {
	const results = fileData.map(value => validator.validate(value, '')).filter(Either.isLeft);

	if (results.length !== 0) {
		console.error('Error! Error when validating CAPWATCH file data');

		const displayCount = 3;

		console.error(results.map(({ value }) => value).slice(displayCount));

		if (results.length > displayCount) {
			console.error(`... and ${results.length - displayCount} more errors`)
		}

		return false;
	}

	return true;
}

export interface CAPWATCHFileResult {
	type: 'Result';
	error: CAPWATCHImportErrors;
}

export interface CAPWATCHFileUpdateResult {
	type: 'Update';
	currentRecord: number;
}

export interface CAPWATCHFilePermissionsResult {
	type: 'PermsError';
	memberName: string;
	capid: number;
}

>>>>>>> Stashed changes
export type CAPWATCHModule<T> = (
	fileData: Array<FileData<T>>,
	schema: Schema,
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
): AsyncIterableIterator<CAPWATCHModuleResult> {
	await session.startTransaction();

	const foundModules: { [key: string]: boolean } = {};

	for (const i of files) {
		foundModules[i] = false;
	}

	for (const mod of modules) {
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

		yield new Promise<CAPWATCHModuleResult>(res => {
			parser.on('end', () => {
				void mod.module(rows, schema).then(error =>
					res({
						error,
						file: mod.file,
					}),
				);
			});

			zippedFile.pipe(parser);
		});
	}

	for (const i in foundModules) {
		if (foundModules.hasOwnProperty(i) && !foundModules[i]) {
			console.error('Invalid file passed to ImportCAPWATCHFile:', i);
		}
	}

	await session.commit();
}
