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
import { NHQ, Validator } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.Commanders>(Validator) as Validator<NHQ.Commanders>,
);

const commanders: CAPWATCHModule<NHQ.Commanders> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
) {
	if (!trustedFile) {
		return CAPWATCHError.NOPERMISSIONS;
	}

	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	const commandersCollection = schema.getCollection<NHQ.Commanders>('NHQ_Commanders');

	try {
		await commandersCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.CLEAR,
		};
	}

	let currentRecord = 0;

	for (const commander of fileData) {
		try {
			const values: NHQ.Commanders = {
				ORGID: parseInt(commander.ORGID, 10),
				Region: commander.Region,
				Wing: commander.Wing,
				Unit: commander.Unit,
				CAPID: parseInt(commander.CAPID, 10),
				DateAsg: convertNHQDate(commander.DateAsg).toISOString(),
				UsrID: commander.UsrID,
				DateMod: convertNHQDate(commander.DateMod).toISOString(),
				NameLast: commander.NameLast,
				NameFirst: commander.NameFirst,
				NameMiddle: commander.NameMiddle,
				NameSuffix: commander.NameSuffix,
				Rank: commander.Rank,
			};

			await commandersCollection.add(values).execute();

			currentRecord++;
			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		} catch (e) {
			console.warn(e);
			return yield {
				type: 'Result',
				error: CAPWATCHError.INSERT,
			};
		}
	}

	return yield {
		type: 'Result',
		error: CAPWATCHError.NONE,
	};
};

export default commanders;
