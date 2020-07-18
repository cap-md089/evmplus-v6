import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const memberParse: CAPWATCHModule<NHQ.NHQMember> = async (fileData, schema) => {
	if (
		fileData.length === 0 ||
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

	const memberCollection = schema.getCollection<NHQ.NHQMember>('NHQ_Member');
	const memberContactCollection = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

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
				Type: member.Type,
				RankDate: convertNHQDate(member.RankDate).toISOString(),
				Region: member.Region,
				MbrStatus: member.MbrStatus,
				PicStatus: member.PicStatus,
				PicDate: convertNHQDate(member.PicDate).toISOString(),
				CdtWaiver: member.CdtWaiver,
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
