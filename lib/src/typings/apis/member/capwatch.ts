import { APIEither } from '../../../typings/api';
import { CAPWATCHImportErrors, CAPWATCHImportUpdate } from '../../../typings/types';

export interface CAPWATCHFileDownloadedResult {
	type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded;
	id: number;
	currentStep: number;
}

export interface CAPWATCHFileImportedResult {
	type: CAPWATCHImportUpdate.FileImported;
	orgID: number;
	error: CAPWATCHImportErrors;
	file: string;
}

export interface CAPWATCHFileDoneResult {
	type: CAPWATCHImportUpdate.CAPWATCHFileDone;
	id: number;
	currentStep: number;
}

export interface CAPWATCHProgressInitialization {
	type: CAPWATCHImportUpdate.ProgressInitialization;
	totalSteps: number;
}

export interface RequestImport {
	(params: {}, body: { orgIDs: number[]; files?: string[]; password: string }): APIEither<
		CAPWATCHFileImportedResult[]
	>;

	url: '/api/member/capwatch/import';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
