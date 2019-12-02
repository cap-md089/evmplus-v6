import { left, none } from 'common-lib';
import { asyncErrorHandler, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberRequest<{ list: string; token: string }>, res) => {
		// Depends on CAPNHQUser having a getCAPWATCHFile method
		// It doesn't, we need to program it to be able to interface with the 'API'

		res.status(500);
		return res.json(
			left({
				code: 500,
				error: none<Error>(),
				message: 'Not implemented'
			})
		);

		/*
	if (!await validRawTokenAlone(req.mysqlx, req.params.token)) {
		res.status(403);
		return res.end();
	}

	if (!(req.member instanceof CAPNHQUser)) {
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

	for (const orgid of orgids) {
		try {
			fileLocation = await req.member.getCAPWATCHFile(orgid.toString());

			currentStep++;
			res.write(
				JSON.stringify({
					type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded,
					id: orgid,
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
			orgid,
			filesToImport
		);

		for await (const progress of importProgress) {
			currentStep++;
			res.write(
				JSON.stringify({
					type: CAPWATCHImportUpdate.FileImported,
					id: orgid,
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
				id: orgid,
				currentStep
			})
		);
	}

	res.status(200);
	res.end();
	*/
	}
);
