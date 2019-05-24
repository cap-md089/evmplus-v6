import { CAPWATCHImportErrors, CAPWATCHImportUpdate } from 'common-lib/index';
import ImportCAPWATCHFile from '../../../lib/ImportCAPWATCHFile';
import { MemberRequest, NHQMember } from '../../../lib/Members';
import { asyncErrorHandler } from '../../../lib/Util';
import { validRawToken } from '../../formtoken';

export default asyncErrorHandler(async (req: MemberRequest<{ list: string, token: string }>, res) => {
	if (!validRawToken(req.params.token, req.member)) {
		res.status(403);
		return res.end();
	}

	if (!(req.member instanceof NHQMember)) {
		res.status(403);
		return res.end();
	}

	const stringORGIDS = req.params.list.split(',');
	const orgids: number[] = [];
	for (const i in stringORGIDS) {
		if (stringORGIDS.hasOwnProperty(i)) {
			orgids.push(parseInt(stringORGIDS[i], 10));
			if (orgids[i] !== orgids[i]) {
				res.status(400);
				return res.end();
			}
		}
	}

	const filesToImport = [
		'Member.txt',
		'DutyPosition.txt',
		'MbrContact.txt',
		'CadetDutyPositions.txt',
		'CadetActivities.txt',
		'OFlight.txt'
	];
	// Each file imported has an event it fires, plus the download, plus the finish event
	const totalSteps = (filesToImport.length + 2) * orgids.length;
	let currentStep = 0;

	res.header('Content-type', 'text/event-stream');
	res.flushHeaders();

	res.write(
		JSON.stringify({
			type: CAPWATCHImportUpdate.ProgressInitialization,
			totalSteps
		})
	);

	let fileLocation = '';

	for (let i = 0; i < orgids.length; i++) {
		const currentORGID = orgids[i];

		try {
			fileLocation = await req.member.getCAPWATCHFile(currentORGID.toString());

			currentStep++;
			res.write(
				JSON.stringify({
					type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded,
					id: currentORGID,
					currentStep
				})
			);
		} catch (e) {
			res.status(403);
			return res.end();
		}

		const importProgress = ImportCAPWATCHFile(
			fileLocation,
			req.mysqlx,
			currentORGID,
			filesToImport
		);

		for await (const progress of importProgress) {
			currentStep++;
			res.write(
				JSON.stringify({
					type: CAPWATCHImportUpdate.FileImported,
					id: currentORGID,
					error: progress.error !== CAPWATCHImportErrors.NONE,
					currentStep,
					file: progress.file
				})
			);

			if (progress.error !== CAPWATCHImportErrors.NONE) {
				console.log(progress.error, progress.file);
			}
		}

		currentStep++;
		res.write(
			JSON.stringify({
				type: CAPWATCHImportUpdate.CAPWATCHFileDone,
				id: currentORGID,
				currentStep
			})
		);
	}

	res.status(200);
	res.end();
});
