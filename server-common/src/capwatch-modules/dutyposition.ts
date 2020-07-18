import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const dutyPosition: CAPWATCHModule<NHQ.DutyPosition> = async (fileData, schema) => {
	if (typeof fileData[0].CAPID === 'undefined' || typeof fileData[0].Duty === 'undefined') {
		return CAPWATCHError.BADDATA;
	}

	let values;

	try {
		const dutyPositionCollection = schema.getCollection<NHQ.DutyPosition>('NHQ_DutyPosition');

		const clearedORGIDs: { [key: number]: boolean } = {};

		for (const duties of fileData) {
			if (!clearedORGIDs[duties.ORGID]) {
				try {
					await dutyPositionCollection
						.remove('ORGID = :ORGID')
						.bind('ORGID', parseInt(duties.ORGID + '', 10))
						.execute();
				} catch (e) {
					console.warn(e);
					return CAPWATCHError.CLEAR;
				}

				clearedORGIDs[duties.ORGID] = true;
			}

			values = {
				CAPID: parseInt(duties.CAPID + '', 10),
				Duty: duties.Duty,
				FunctArea: duties.FunctArea,
				Lvl: duties.Lvl,
				Asst: parseInt(duties.Asst + '', 10),
				UsrID: duties.UsrID,
				DateMod: convertNHQDate(duties.DateMod).toISOString(),
				ORGID: parseInt(duties.ORGID + '', 10),
			};

			await dutyPositionCollection.add(values).execute();
		}

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default dutyPosition;
