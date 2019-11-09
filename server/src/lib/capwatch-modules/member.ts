import { NHQ } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertNHQDate } from '../MySQLUtil';

const memberParse: CAPWATCHModule<NHQ.CAPMember> = async (fileData, schema, orgid) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].DOB === 'undefined' ||
		typeof fileData[0].Expiration === 'undefined' ||
		typeof fileData[0].MbrStatus === 'undefined' ||
		typeof fileData[0].NameFirst === 'undefined' ||
		typeof fileData[0].NameLast === 'undefined' ||
		typeof fileData[0].NameMiddle === 'undefined' ||
		typeof fileData[0].NameSuffix === 'undefined' ||
		typeof fileData[0].ORGID === 'undefined' ||
		typeof fileData[0].Rank === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Region === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const memberCollection = schema.getCollection<NHQ.CAPMember>('NHQ_Member');

	try {
		await memberCollection
			.remove('ORGID = :ORGID')
			.bind('ORGID', orgid)
			.execute();
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.CLEAR;
	}

	for (const member of fileData) {
		try {
			const values = {
				CAPID: parseInt(member.CAPID + '', 10),
				SSN: member.SSN,
				NameLast: member.NameLast,
				NameFirst: member.NameFirst,
				NameMiddle: member.NameMiddle,
				NameSuffix: member.NameSuffix,
				Gender: member.Gender,
				DOB: convertNHQDate(member.DOB).toISOString(),
				Profession: member.Profession,
				EducationLevel: member.EducationLevel,
				Citizen: member.Citizen,
				ORGID: orgid,
				Wing: member.Wing,
				Unit: member.Unit,
				Rank: member.Rank,
				Joined: convertNHQDate(member.Joined).toISOString(),
				Expiration: convertNHQDate(member.Expiration).toISOString(),
				OrgJoined: convertNHQDate(member.OrgJoined).toISOString(),
				UsrID: member.UsrID,
				DateMod: convertNHQDate(member.DateMod).toISOString(),
				LSCode: member.LSCode,
				Type: member.Type,
				RankDate: convertNHQDate(member.RankDate).toISOString(),
				Region: member.Region,
				MbrStatus: member.MbrStatus,
				PicStatus: member.PicStatus,
				PicDate: convertNHQDate(member.PicDate).toISOString(),
				CdtWaiver: member.CdtWaiver
			};

			await memberCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default memberParse;
