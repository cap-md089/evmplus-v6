import { Schema, Session } from '@mysql/xdevapi';
import { spawn } from 'child_process';
import { CAPWATCHImportErrors } from 'common-lib';
import * as csv from 'csv-parse';
import cadetActivities from './capwatch-modules/cadetactivities';
import cadetDutyPosition from './capwatch-modules/cadetdutypositions';
import dutyPosition from './capwatch-modules/dutyposition';
import mbrAchievements from './capwatch-modules/mbrachievement';
import mbrContact from './capwatch-modules/mbrcontact';
import memberParse from './capwatch-modules/member';
import oFlight from './capwatch-modules/oflight';
import organization from './capwatch-modules/organization';

export { CAPWATCHImportErrors as CAPWATCHError };

export type CAPWATCHModule<T> = (fileData: T[], schema: Schema) => Promise<CAPWATCHImportErrors>;

const modules: {
	module: CAPWATCHModule<any>;
	file: string;
}[] = [
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
		module: cdtAchvEnum,
		file: 'CadetAchievementsEnumeration.txt'
	},
	{
		module: achievements,
		file: 'Achievements.txt'
	},
	{
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
	files: string[] = modules.map(mod => mod.file)
): AsyncIterableIterator<CAPWATCHModuleResult> {
	session.startTransaction();

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
			let record;
			// tslint:disable-next-line: no-conditional-assignment
			while ((record = parser.read())) {
				rows.push(record);
			}
		});

		yield new Promise<CAPWATCHModuleResult>(res => {
			parser.on('end', async () => {
				res({
					error: await mod.module(rows, schema),
					file: mod.file,
				});
			});

			zippedFile.pipe(parser);
		});
	}

	for (const i in foundModules) {
		if (foundModules.hasOwnProperty(i) && !foundModules[i]) {
			console.error('Invalid file passed to ImportCAPWATCHFile:', i);
		}
	}

	session.commit();
}
