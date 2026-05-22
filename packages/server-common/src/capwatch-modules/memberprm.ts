/**
 * Copyright (C) 2026 Andrew Rioux
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
	validator<NHQ.MemberPrm>(Validator) as Validator<NHQ.MemberPrm>,
);

const memberPrmParse: CAPWATCHModule<NHQ.MemberPrm> = async function* (
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

	try {
		const collection = schema.getCollection<NHQ.MemberPrm>('NHQ_MemberPrm');

		if (!(await collection.existsInDatabase())) {
			await schema.createCollection('NHQ_MemberPrm');
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

		for (const prm of fileData) {
			if (!isORGIDValid(capidMap[parseInt(prm.CAPID, 10)])) {
				return yield {
					type: 'Result',
					error: CAPWATCHError.NOPERMISSIONS,
				};
			}

			const values: NHQ.MemberPrm = {
				CAPID: parseInt(prm.CAPID, 10),
				ORGIDLvl: parseInt(prm.ORGIDLvl, 10),
				MbrName: prm.MbrName,
				Region: prm.Region,
				Wing: prm.Wing,
				Unit: prm.Unit,
				MbrUnit: prm.MbrUnit,
				Scope: prm.Scope,
				Expiration: convertNHQDate(prm.Expiration).toISOString(),
				UsrID: prm.UsrID,
				WebAppName: prm.WebAppName,
				FunctArea: prm.FunctArea,
				WebModName: prm.WebModName,
				Process: prm.Process,
				DateMod: convertNHQDate(prm.DateMod).toISOString(),
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

export default memberPrmParse;