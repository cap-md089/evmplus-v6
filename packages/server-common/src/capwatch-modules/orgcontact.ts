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
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../ImportCAPWATCHFile';
import { convertNHQDate } from '../MySQLUtil';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.OrgContact>(Validator) as Validator<NHQ.OrgContact>,
);

const orgContactParse: CAPWATCHModule<NHQ.OrgContact> = async function* (
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

	const orgContactCollection = schema.getCollection<NHQ.OrgContact>('NHQ_OrgContact');

	try {
		await orgContactCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.CLEAR,
		};
	}

	let currentRecord = 0;

	for (const orgContact of fileData) {
		try {
			const values: NHQ.OrgContact = {
				ORGID: parseInt(orgContact.ORGID, 10),
				Wing: orgContact.Wing,
				Unit: orgContact.Unit,
				Type: orgContact.Type,
				Priority: orgContact.Priority,
				Contact: orgContact.Contact,
				UsrID: orgContact.UsrID,
				DateMod: convertNHQDate(orgContact.DateMod).toISOString(),
			};

			await orgContactCollection.add(values).execute();

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

export default orgContactParse;
