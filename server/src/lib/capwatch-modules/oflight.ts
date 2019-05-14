import { NHQ } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertNHQDate, modifyAndBind } from '../MySQLUtil';

const oFlight: CAPWATCHModule<NHQ.OFlight> = async (fileData, schema) => {
	if (
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].Amount === 'undefined' ||
		typeof fileData[0].Syllabus === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].FltDate === 'undefined' ||
		typeof fileData[0].TransDate === 'undefined' ||
		typeof fileData[0].FltRlsNum === 'undefined' ||
		typeof fileData[0].AcftTailNum === 'undefined' ||
		typeof fileData[0].FltTime === 'undefined' ||
		typeof fileData[0].LstUsr === 'undefined' ||
		typeof fileData[0].LstDateMod === 'undefined' ||
		typeof fileData[0].Comments === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const oFlightCollection = schema.getCollection<NHQ.OFlight>('NHQ_OFlight');

	for (const oFlightConst of fileData) {
		try {
			const values = {
				CAPID: parseInt(oFlightConst.CAPID + '', 10),
				Wing: oFlightConst.Wing,
				Unit: oFlightConst.Unit,
				Amount: oFlightConst.Amount,
				Syllabus: oFlightConst.Syllabus,
				Type: oFlightConst.Type,
				FltDate: convertNHQDate(oFlightConst.FltDate).toISOString(),
				TransDate: convertNHQDate(oFlightConst.TransDate).toISOString(),
				FltRlsNum: oFlightConst.FltRlsNum,
				AcftTailNum: oFlightConst.AcftTailNum,
				FltTime: oFlightConst.FltTime,
				LstUsr: oFlightConst.LstUsr,
				LstDateMod: oFlightConst.LstDateMod,
				Comments: oFlightConst.Comments
			};
			try {
				await oFlightCollection.add(values).execute();
			} catch (e) {
				console.warn(e);
				await modifyAndBind(oFlightCollection, {
					CAPID: values.CAPID,
					Wing: values.Wing,
					Unit: values.Unit,
					Amount: values.Amount,
					Syllabus: values.Syllabus,
					Type: values.Type,
					FltDate: values.FltDate,
					TransDate: values.TransDate,
					FltRlsNum: values.FltRlsNum,
					AcftTailNum: values.AcftTailNum,
					FltTime: values.FltTime,
					LstUsr: values.LstUsr,
					LstDateMod: values.LstDateMod,
					Comments: values.Comments
				}).patch(values).execute();
			}
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default oFlight;
