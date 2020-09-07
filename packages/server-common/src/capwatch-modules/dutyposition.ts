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

import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const dutyPosition: CAPWATCHModule<NHQ.DutyPosition> = async (fileData, schema) => {
	if (typeof fileData[0].CAPID === 'undefined' || typeof fileData[0].Duty === 'undefined') {
		return CAPWATCHError.BADDATA;
	}

	let values;

	try {
		const dutyPositionCollection = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');

		const clearedORGIDs: { [key: string]: boolean } = {};

		for (const duties of fileData) {
			if (!clearedORGIDs[duties.ORGID]) {
				try {
					await dutyPositionCollection
						.remove('ORGID = :ORGID')
						.bind('ORGID', parseInt(duties.ORGID + '', 10))
						.execute();
				} catch (e) {
					console.warn(e);
					return CAPWATCHError.CLEAR;
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
		}

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default dutyPosition;
