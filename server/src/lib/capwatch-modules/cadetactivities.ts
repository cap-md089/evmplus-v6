import { NHQ } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertNHQDate, modifyAndBind } from '../MySQLUtil';

const cadetActivities: CAPWATCHModule<NHQ.CadetActivities> = async (fileData, schema, orgid) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].Location === 'undefined' ||
		typeof fileData[0].Completed === 'undefined' ||
		typeof fileData[0].UsrID === 'undefined' ||
		typeof fileData[0].DateMod === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const cadetActivitiesCollection = schema.getCollection<NHQ.CadetActivities>(
		'NHQ_CadetActivities'
	);

	for (const cadetActivitiesConst of fileData) {
		try {
			const values = {
				CAPID: parseInt(cadetActivitiesConst.CAPID + '', 10),
				Type: cadetActivitiesConst.Type,
				Location: cadetActivitiesConst.Location,
				Completed: convertNHQDate(cadetActivitiesConst.Completed).toISOString(),
				UsrID: cadetActivitiesConst.UsrID,
				DateMod: convertNHQDate(cadetActivitiesConst.DateMod).toISOString()
			};
			try {
				await cadetActivitiesCollection.add(values).execute();
			} catch (e) {
				console.warn(e);
				await modifyAndBind(cadetActivitiesCollection, {
					CAPID: values.CAPID,
					Type: values.Type,
					Completed: values.Completed
				})
					.patch(values)
					.execute();
			}
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetActivities;
