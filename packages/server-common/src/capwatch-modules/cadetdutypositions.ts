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
import { Either, NHQ, Validator } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.CadetDutyPosition>(Validator) as Validator<NHQ.CadetDutyPosition>,
);

const cadetDutyPosition: CAPWATCHModule<NHQ.CadetDutyPosition> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
	capidMap,
) {
	if (!!fileData.map(value => recordValidator.validate(value, '')).find(Either.isLeft)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	let values;

	let currentRecord = 0;

	try {
		const dutyPositionCollection = schema.getCollection<NHQ.CadetDutyPosition>(
			'NHQ_CadetDutyPosition',
		);

		for (const duties of fileData) {
			if (!isORGIDValid(capidMap[parseInt(duties.CAPID, 10)])) {
				return yield {
					type: 'Result',
					error: CAPWATCHError.NOPERMISSIONS,
				};
			}

			values = {
				CAPID: parseInt(duties.CAPID, 10),
				Duty: duties.Duty,
				FunctArea: duties.FunctArea,
				Lvl: duties.Lvl,
				Asst: parseInt(duties.Asst, 10),
				UsrID: duties.UsrID,
				DateMod: convertNHQDate(duties.DateMod).toISOString(),
				ORGID: parseInt(duties.ORGID, 10),
			};

			await dutyPositionCollection.add(values).execute();

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

export default cadetDutyPosition;
