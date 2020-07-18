import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const mbrContact: CAPWATCHModule<NHQ.MbrContact> = async (fileData, schema) => {
	if (typeof fileData[0].CAPID === 'undefined') {
		return CAPWATCHError.BADDATA;
	}

	try {
		const mbrContactCollection = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

		let values;

		for (const duties of fileData) {
			values = {
				CAPID: parseInt(duties.CAPID.toString(), 10),
				Type: duties.Type,
				Priority: duties.Priority,
				Contact: duties.Contact,
				UsrID: duties.UsrID,
				DateMod: convertNHQDate(duties.DateMod).toISOString(),
				DoNotContact: duties.DoNotContact,
			};

			await mbrContactCollection.add(values).execute();
		}

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default mbrContact;
