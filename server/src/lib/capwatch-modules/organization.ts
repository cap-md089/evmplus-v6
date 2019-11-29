import { NHQ } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const organizationParse: CAPWATCHModule<NHQ.Organization> = async (fileData, schema, orgid) => {
	if (
		typeof fileData[0].ORGID === 'undefined' ||
		typeof fileData[0].Region === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].NextLevel === 'undefined' ||
		typeof fileData[0].Name === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].Status === 'undefined' ||
		typeof fileData[0].Scope === 'undefined' ||
		typeof fileData[0].OrgNotes === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const organizationCollection = schema.getCollection<NHQ.Organization>('NHQ_Organization');

	try {
		await organizationCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.CLEAR;
	}

	for (const organization of fileData) {
		try {
			const values = {
				ORGID: parseInt(organization.ORGID.toString(), 10),
				Region: organization.Region,
				Wing: organization.Wing,
				Unit: organization.Unit,
				NextLevel: organization.NextLevel,
				Name: organization.Name,
				Type: organization.Type,
				DateChartered: organization.DateChartered,
				Status: organization.Status,
				Scope: organization.Scope,
				UsrID: organization.UsrID,
				DateMod: organization.DateMod,
				FirstUsr: organization.FirstUsr,
				DateCreated: organization.DateCreated,
				DateReceived: organization.DateReceived,
				OrgNotes: organization.OrgNotes
			};

			await organizationCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default organizationParse;
