/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NHQ } from 'common-lib';
import { convertNHQDate, modifyAndBind } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const cadetActivities: CAPWATCHModule<NHQ.CadetActivities> = async (fileData, schema) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].Location === 'undefined' ||
		typeof fileData[0].Completed === 'undefined' ||
		typeof fileData[0].UsrID === 'undefined' ||
		typeof fileData[0].DateMod === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const cadetActivitiesCollection = schema.getCollection<NHQ.CadetActivities>(
		'NHQ_CadetActivities'
	);

	for (const cadetActivitiesConst of fileData) {
		try {
			const values = {
				CAPID: parseInt(cadetActivitiesConst.CAPID + '', 10),
				Type: cadetActivitiesConst.Type,
				Location: cadetActivitiesConst.Location,
				Completed: convertNHQDate(cadetActivitiesConst.Completed).toISOString(),
				UsrID: cadetActivitiesConst.UsrID,
				DateMod: convertNHQDate(cadetActivitiesConst.DateMod).toISOString()
			};
			try {
				await cadetActivitiesCollection.add(values).execute();
			} catch (e) {
				console.warn(e);
				await modifyAndBind(cadetActivitiesCollection, {
					CAPID: values.CAPID,
					Type: values.Type,
					Completed: values.Completed
				})
					.patch(values)
					.execute();
			}
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetActivities;
