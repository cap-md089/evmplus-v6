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
	validator<NHQ.MbrAchievements>(Validator) as Validator<NHQ.MbrAchievements>,
);

const mbrAchievements: CAPWATCHModule<NHQ.MbrAchievements> = async function* (
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

	let values: NHQ.MbrAchievements;

	const mbrAchievementsCollection = schema.getCollection<NHQ.MbrAchievements>(
		'NHQ_MbrAchievements',
	);

	try {
		await mbrAchievementsCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.CLEAR,
		};
	}

	try {
		let currentRecord = 0;

		for (const achv of fileData) {
			if (!isORGIDValid(capidMap[parseInt(achv.CAPID, 10)])) {
				return yield {
					type: 'Result',
					error: CAPWATCHError.NOPERMISSIONS,
				};
			}

			values = {
				CAPID: parseInt(achv.CAPID.toString(), 10),
				AchvID: parseInt(achv.AchvID.toString(), 10),
				AuthByCAPID: parseInt(achv.AuthByCAPID.toString(), 10),
				AuthDate: +convertNHQDate(achv.AuthDate.toString()),
				AuthReason: achv.AuthReason,
				Completed: parseInt(achv.Completed.toString(), 10),
				DateCreated:
					achv.DateCreated.toString() === 'NTC'
						? +Date.now()
						: +convertNHQDate(achv.DateCreated.toString()),
				DateMod: +convertNHQDate(achv.DateMod.toString()),
				Expiration: +convertNHQDate(achv.Expiration.toString()),
				FirstUsr: achv.FirstUsr,
				ORGID: parseInt(achv.ORGID.toString(), 10),
				OriginallyAccomplished: +convertNHQDate(achv.OriginallyAccomplished.toString()),
				RecID: parseInt(achv.RecID.toString(), 10),
				Source: achv.Source,
				Status: achv.Status as NHQ.MbrAchievements['Status'],
				UsrID: achv.UsrID,
			};

			await mbrAchievementsCollection.add(values).execute();

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

export default mbrAchievements;
