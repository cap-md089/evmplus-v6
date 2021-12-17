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

import { Collection } from '@mysql/xdevapi';
import { validator } from 'auto-client-api';
import { getFullMemberName, NHQ, Validator } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../ImportCAPWATCHFile';
import { collectResults, findAndBind } from '../MySQLUtil';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.NHQMember>(Validator) as Validator<NHQ.NHQMember>,
);

const memberParse: CAPWATCHModule<NHQ.NHQMember> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
	capidMap,
	files,
) {
	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');
	const memberContactCollection = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');
	const cadetAchvCollection = schema.getCollection<NHQ.CadetAchv>('NHQ_CadetAchv');
	const cadetAchvAprsCollection = schema.getCollection<NHQ.CadetAchv>('NHQ_CadetAchvAprs');
	const cadetDutyPositionCollection = schema.getCollection<NHQ.CadetDutyPosition>(
		'NHQ_CadetDutyPosition',
	);
	const dutyPositionCollection = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');
	const mbrAchievementsCollection = schema.getCollection<NHQ.MbrAchievements>(
		'NHQ_MbrAchievements',
	);
	const cadetActivitiesCollection = schema.getCollection<NHQ.MbrAchievements>(
		'NHQ_CadetActivities',
	);
	const cadetHFZInformationCollection = schema.getCollection<NHQ.CadetHFZInformation>(
		'NHQ_CadetHFZInformation',
	);
	const oFlightCollection = schema.getCollection<NHQ.OFlight>('NHQ_OFlight');

	const extraCollections = [];

	const collectionMap: { [key: string]: Collection<{ CAPID: number }> } = {
		'DutyPosition.txt': dutyPositionCollection,
		'MbrContact.txt': memberContactCollection,
		'CadetDutyPositions.txt': cadetDutyPositionCollection,
		'CadetActivities.txt': cadetActivitiesCollection,
		'OFlight.txt': oFlightCollection,
		'MbrAchievements': mbrAchievementsCollection,
		'CadetAchv.txt': cadetAchvCollection,
		'CadetAchvAprs.txt': cadetAchvAprsCollection,
		'CadetHFZInformation.txt': cadetHFZInformationCollection,
	};

	// Only clear out tables we intend to fill later
	for (const file of files) {
		if (file in collectionMap) {
			extraCollections.push(collectionMap[file]);
		}
	}

	let currentRecord = 0;

	for (const member of fileData) {
		try {
			const results = await collectResults(
				findAndBind(memberCollection, {
					CAPID: parseInt(member.CAPID, 10),
				}),
			);

			if (results.length !== 0 && !isORGIDValid(results[0].ORGID)) {
				return yield {
					type: 'PermsError',
					capid: parseInt(member.CAPID, 10),
					memberName: getFullMemberName({
						memberRank: member.Rank,
						nameFirst: member.NameFirst,
						nameLast: member.NameLast,
						nameMiddle: member.NameMiddle,
						nameSuffix: member.NameSuffix,
					}),
				};
			}

			capidMap[parseInt(member.CAPID, 10)] = parseInt(member.ORGID, 10);

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

			await Promise.all([
				memberCollection
					.remove('CAPID = :CAPID')
					.bind('CAPID', parseInt(member.CAPID, 10))
					.execute()
					.then(() => memberCollection.add(values).execute()),
				...extraCollections.map((collection: Collection<{ CAPID: number }>) =>
					collection
						.remove('CAPID = :CAPID')
						.bind('CAPID', parseInt(member.CAPID, 10))
						.execute(),
				),
			]);

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
