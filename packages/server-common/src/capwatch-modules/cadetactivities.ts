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
	validator<NHQ.CadetActivities>(Validator) as Validator<NHQ.CadetActivities>,
);

const cadetActivities: CAPWATCHModule<NHQ.CadetActivities> = async function* (
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

	const cadetActivitiesCollection = schema.getCollection<NHQ.CadetActivities>(
		'NHQ_CadetActivities',
	);

	let currentRecord = 0;

	for (const cadetActivitiesConst of fileData) {
		if (!isORGIDValid(capidMap[parseInt(cadetActivitiesConst.CAPID, 10)])) {
			return yield {
				type: 'Result',
				error: CAPWATCHError.NOPERMISSIONS,
			};
		}

		try {
			const values = {
				CAPID: parseInt(cadetActivitiesConst.CAPID + '', 10),
				Type: cadetActivitiesConst.Type,
				Location: cadetActivitiesConst.Location,
				Completed: convertNHQDate(cadetActivitiesConst.Completed).toISOString(),
				UsrID: cadetActivitiesConst.UsrID,
				DateMod: convertNHQDate(cadetActivitiesConst.DateMod).toISOString(),
			};

			await cadetActivitiesCollection.add(values).execute();

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

export default cadetActivities;
