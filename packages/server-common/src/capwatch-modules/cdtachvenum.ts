/**
 * Copyright (C) 2020 Glenn Rioux
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
	validator<NHQ.CdtAchvEnum>(Validator) as Validator<NHQ.CdtAchvEnum>,
);

const cadetAchievementEnumParse: CAPWATCHModule<NHQ.CdtAchvEnum> = async function* (
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

	const cadetAchievementEnumCollection = schema.getCollection<NHQ.CdtAchvEnum>('NHQ_CdtAchvEnum');

	await cadetAchievementEnumCollection.remove('FirstUsr = "coopertd"').execute();

	for (const member of fileData) {
		try {
			const values: NHQ.CdtAchvEnum = {
				CadetAchvID: parseInt(member.CadetAchvID, 10),
				AchvName: member.AchvName,
				CurAwdNo: parseInt(member.CurAwdNo, 10),
				UsrID: member.UsrID,
				DateMod: convertNHQDate(member.DateMod).toISOString(),
				FirstUsr: member.FirstUsr,
				DateCreated: convertNHQDate(member.DateCreated).toISOString(),
				Rank: member.Rank,
			};

			await cadetAchievementEnumCollection.add(values).execute();
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

export default cadetAchievementEnumParse;
