/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { validator } from 'auto-client-api';
import { NHQ, Validator } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.SeniorLevel>(Validator) as Validator<NHQ.SeniorLevel>,
);

const seniorLevel: CAPWATCHModule<NHQ.SeniorLevel> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
	capidMap,
) {
	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	let values;

	try {
		const collection = schema.getCollection<NHQ.SeniorLevel>('NHQ_SeniorLevel');

		if (!(await collection.existsInDatabase())) {
			await schema.createCollection('NHQ_SeniorLevel');
		}

		try {
			await collection.remove('true').execute();
		} catch (e) {
			console.warn(e);
			return yield {
				type: 'Result',
				error: CAPWATCHError.CLEAR,
			};
		}

		let currentRecord = 0;

		for (const datum of fileData) {
			if (!isORGIDValid(capidMap[parseInt(datum.CAPID, 10)])) {
				return yield {
					type: 'Result',
					error: CAPWATCHError.NOPERMISSIONS,
				};
			}

			values = {
				CAPID: parseInt(datum.CAPID, 10),
				Lvl: datum.Lvl,
				Completed: convertNHQDate(datum.Completed).toISOString(),
				UsrID: datum.UsrID,
				DateMod: convertNHQDate(datum.DateMod).toISOString(),
				FirstUsr: datum.FirstUsr,
				DateCreated: convertNHQDate(datum.DateCreated).toISOString(),
				RecID: parseInt(datum.RecID, 10),
			};

			await collection.add(values).execute();

			currentRecord++;
			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		}

		return yield {
			type: 'Result',
			error: CAPWATCHError.NONE,
		};
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.INSERT,
		};
	}
};

export default seniorLevel;
