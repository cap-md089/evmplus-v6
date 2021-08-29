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
	validator<NHQ.DutyPosition>(Validator) as Validator<NHQ.DutyPosition>,
);

const dutyPosition: CAPWATCHModule<NHQ.DutyPosition> = async function* (backend, fileData, schema) {
	if (!!fileData.map(value => recordValidator.validate(value, '')).find(Either.isLeft)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	let values;

	try {
		const dutyPositionCollection = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');

		const clearedORGIDs: { [key: string]: boolean } = {};

		let currentRecord = 0;

		for (const duties of fileData) {
			if (!clearedORGIDs[duties.ORGID]) {
				try {
					await dutyPositionCollection
						.remove('ORGID = :ORGID')
						.bind('ORGID', parseInt(duties.ORGID + '', 10))
						.execute();
				} catch (e) {
					console.warn(e);
					return yield {
						type: 'Result',
						error: CAPWATCHError.CLEAR,
					};
				}

				clearedORGIDs[duties.ORGID] = true;
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

export default dutyPosition;
