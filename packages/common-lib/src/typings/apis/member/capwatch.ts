/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is left for historical purposes; the server does not actually
 * implement this API, to remain in accordance with CAPR 120-1 paragraph 6.16
 *
 * To import CAPWATCH files, instead use the importCapwatch.js util in util-cli
 *
 * Hopefully, the regulation will change, and maybe another UI will be provided
 * to upload CAPWATCH files
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../../api';
import { CAPWATCHImportErrors, CAPWATCHImportUpdate } from '../../types';

// Each of the `Result` interfaces contains a currentStep, to allow a progress indicator

/**
 * Contains information for when a CAPWATCH file is downloaded, to include the
 * ORGID of the target CAPWATCH file
 */
export interface CAPWATCHFileDownloadedResult {
	type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded;
	id: number;
	currentStep: number;
}

/**
 * Contains information about when a TXT file inside a CAPWATCH file is imported
 */
export interface CAPWATCHFileImportedResult {
	type: CAPWATCHImportUpdate.FileImported;
	orgID: number;
	error: CAPWATCHImportErrors;
	file: string;
}

/**
 * Shows which file in the CAPWATCH bundle has been fully imported
 */
export interface CAPWATCHFileDoneResult {
	type: CAPWATCHImportUpdate.CAPWATCHFileDone;
	id: number;
	currentStep: number;
}

/**
 * Communicates how many steps the server will be communicating
 */
export interface CAPWATCHProgressInitialization {
	type: CAPWATCHImportUpdate.ProgressInitialization;
	totalSteps: number;
}

/**
 * Imports CAPWATCH files for the specified ORG IDs, given a password to go with the
 * CAP ID that works with eServices
 *
 * Goes against CAPR 120-1 paragraph 6.16, and is therefore deprecated. Hopefully, it
 * can be eventually reenabled
 *
 * @deprecated
 */
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
