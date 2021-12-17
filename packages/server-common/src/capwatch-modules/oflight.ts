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
	validator<NHQ.OFlight>(Validator) as Validator<NHQ.OFlight>,
);

const oFlight: CAPWATCHModule<NHQ.OFlight> = async function* (
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

	const oFlightCollection = schema.getCollection<NHQ.OFlight>('NHQ_OFlight');

	let currentRecord = 0;

	for await (const oFlightConst of fileData) {
		if (!isORGIDValid(capidMap[parseInt(oFlightConst.CAPID, 10)])) {
			return yield {
				type: 'Result',
				error: CAPWATCHError.NOPERMISSIONS,
			};
		}

		try {
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

export default oFlight;
