import { Schema } from '@mysql/xdevapi';
import { exec } from 'child_process';
import * as csv from 'csv-parse';
import { promisify } from 'util';
import { CAPWATCHImportErrors } from '../enums';
import dutyPosition from './capwatch-modules/dutyposition';
import mbrContact from './capwatch-modules/mbrcontact';
import memberParse from './capwatch-modules/member';

export { CAPWATCHImportErrors as CAPWATCHError };

export type CAPWATCHModule<T> = (
	fileData: T[],
	schema: Schema,
	orgid: number
) => Promise<CAPWATCHImportErrors>;

const modules: Array<{
	module: CAPWATCHModule<any>;
	file: string;
}> = [
	{
		module: memberParse,
		file: 'Member.txt'
	},
	{
		module: dutyPosition,
		file: 'DutyPosition.txt'
	},
	{
		module: mbrContact,
		file: 'MbrContact.txt'
	}
];

interface CAPWATCHModuleResult {
	error: CAPWATCHImportErrors;
	file: string;
}

export default async function*(
	zipFileLocation: string,
	schema: Schema,
	orgid: number,
	files: string[] = modules.map(mod => mod.file)
): AsyncIterableIterator<CAPWATCHModuleResult> {
	for (const mod of modules) {
		if (files.indexOf(mod.file) === -1) {
			continue;
		}

		const { stdout } = await promisify(exec)(
			`unzip -op ${zipFileLocation} ${mod.file}`
		);

		yield new Promise<CAPWATCHModuleResult>(res => {
			csv(stdout, { columns: true }, async (err, values) => {
				if (err) {
					res({
						error: CAPWATCHImportErrors.BADDATA,
						file: mod.file
					});
				} else {
					res({
						error: await mod.module(values, schema, orgid),
						file: mod.file
					});
				}
			});
		});
	}
}
