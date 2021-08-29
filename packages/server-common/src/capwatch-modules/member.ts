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
	validator<NHQ.NHQMember>(Validator) as Validator<NHQ.NHQMember>,
);

const memberParse: CAPWATCHModule<NHQ.NHQMember> = async function* (backend, fileData, schema) {
	if (!!fileData.map(value => recordValidator.validate(value, '')).find(Either.isLeft)) {
		console.warn(
			JSON.stringify(
				fileData.map(value => recordValidator.validate(value, '')).find(Either.isLeft),
				null,
				4,
			),
		);
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');
	const memberContactCollection = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

	let currentRecord = 0;

	for (const member of fileData) {
		try {
			await Promise.all([
				memberCollection
					.remove('CAPID = :CAPID')
					.bind({ CAPID: parseInt(member.CAPID + '', 10) })
					.execute(),
				memberContactCollection
					.remove('CAPID = :CAPID')
					.bind({ CAPID: parseInt(member.CAPID + '', 10) })
					.execute(),
			]);

			const values: NHQ.NHQMember = {
				CAPID: parseInt(member.CAPID, 10),
				SSN: '',
				NameLast: member.NameLast,
				NameFirst: member.NameFirst,
				NameMiddle: member.NameMiddle,
				NameSuffix: member.NameSuffix,
				Gender: member.Gender,
				DOB: convertNHQDate(member.DOB).toISOString(),
				Profession: member.Profession,
				EducationLevel: member.EducationLevel,
				Citizen: member.Citizen,
				ORGID: parseInt(member.ORGID + '', 10),
				Wing: member.Wing,
				Unit: member.Unit,
				Rank: member.Rank,
				Joined: convertNHQDate(member.Joined).toISOString(),
				Expiration: convertNHQDate(member.Expiration).toISOString(),
				OrgJoined: convertNHQDate(member.OrgJoined).toISOString(),
				UsrID: member.UsrID,
				DateMod: convertNHQDate(member.DateMod).toISOString(),
				LSCode: member.LSCode,
				Type: member.Type as NHQ.NHQMember['Type'],
				RankDate: convertNHQDate(member.RankDate).toISOString(),
				Region: member.Region,
				MbrStatus: member.MbrStatus,
				PicStatus: member.PicStatus,
				PicDate: convertNHQDate(member.PicDate).toISOString(),
				CdtWaiver: member.CdtWaiver,
			};

			await memberCollection.add(values).execute();

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

export default memberParse;
