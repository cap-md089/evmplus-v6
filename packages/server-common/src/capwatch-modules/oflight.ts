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

const oFlight: CAPWATCHModule<NHQ.OFlight> = async (backend, fileData, schema) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].Amount === 'undefined' ||
		typeof fileData[0].Syllabus === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].FltDate === 'undefined' ||
		typeof fileData[0].TransDate === 'undefined' ||
		typeof fileData[0].FltRlsNum === 'undefined' ||
		typeof fileData[0].AcftTailNum === 'undefined' ||
		typeof fileData[0].FltTime === 'undefined' ||
		typeof fileData[0].LstUsr === 'undefined' ||
		typeof fileData[0].LstDateMod === 'undefined' ||
		typeof fileData[0].Comments === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const oFlightCollection = schema.getCollection<NHQ.OFlight>('NHQ_OFlight');

	const removedCAPIDs: { [key: string]: boolean } = {};

	for await (const oFlightConst of fileData) {
		try {
			if (!removedCAPIDs[oFlightConst.CAPID]) {
				await oFlightCollection
					.remove('CAPID = :CAPID')
					.bind('CAPID', parseInt(oFlightConst.CAPID, 10))
					.execute();
			}

			removedCAPIDs[oFlightConst.CAPID] = true;

			const values: NHQ.OFlight = {
				CAPID: parseInt(oFlightConst.CAPID + '', 10),
				Wing: oFlightConst.Wing,
				Unit: oFlightConst.Unit,
				Amount: parseInt(oFlightConst.Amount, 10),
				Syllabus: parseInt(oFlightConst.Syllabus, 10),
				Type: parseInt(oFlightConst.Type, 10),
				FltDate: convertNHQDate(oFlightConst.FltDate).toISOString(),
				TransDate: convertNHQDate(oFlightConst.TransDate).toISOString(),
				FltRlsNum: oFlightConst.FltRlsNum,
				AcftTailNum: oFlightConst.AcftTailNum,
				FltTime: parseInt(oFlightConst.FltTime, 10),
				LstUsr: oFlightConst.LstUsr,
				LstDateMod: oFlightConst.LstDateMod,
				Comments: oFlightConst.Comments,
			};

			await oFlightCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default oFlight;
