import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertNHQDate } from '../MySQLUtil';

const cadetDutyPosition: CAPWATCHModule<NHQ.CadetDutyPosition> = async (
	fileData,
	schema,
	orgid
) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Duty === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	let values;

	try {
		const dutyPositionCollection = schema.getCollection<NHQ.CadetDutyPosition>(
			'NHQ_DutyPosition'
		);

		try {
			await dutyPositionCollection
				.remove('ORGID = :ORGID')
				.bind('ORGID', orgid)
				.execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.CLEAR;
		}

		const promises = [];

		for await (const duties of fileData) {
			values = {
				CAPID: parseInt(duties.CAPID + '', 10),
				Duty: duties.Duty,
				FunctArea: duties.FunctArea,
				Lvl: duties.Lvl,
				Asst: parseInt(duties.Asst + '', 10),
				UsrID: duties.UsrID,
				DateMod: convertNHQDate(duties.DateMod).toISOString(),
				ORGID: orgid
			};

			promises.push(dutyPositionCollection.add(values).execute());
		}

		await Promise.all(promises);

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default cadetDutyPosition;
