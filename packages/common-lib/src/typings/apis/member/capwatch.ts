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
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../../api';
import {
	CAPWATCHImportErrors,
	CAPWATCHImportRequestType,
	CAPWATCHImportUpdateType,
} from '../../types';

// Each of the `Request` interfaces is used by the client

export interface CAPWATCHImportAuthRequest {
	type: CAPWATCHImportRequestType.ImportFile;
}

export type CAPWATCHImportRequest = CAPWATCHImportAuthRequest;

// These are used for general communication, they don't represent actual download progress indicators

export interface ImportReadyMessage {
	type: 'ImportReady';
}

export interface PermissionDeniedMessage {
	type: 'Denied';
}

export interface ErrorMessage {
	type: 'Error';
	message: string;
}

export type Messages = ImportReadyMessage | PermissionDeniedMessage | ErrorMessage;

// Each of the `Result` interfaces contains a currentStep, to allow a progress indicator

/**
 * Contains information for when a CAPWATCH file is downloaded, to include the
 * ORGID of the target CAPWATCH file
 */
export interface CAPWATCHFileDownloadedResult {
	type: CAPWATCHImportUpdateType.CAPWATCHFileDownloaded;
	currentStep: number;
}

/**
 * Contains information about when a TXT file inside a CAPWATCH file is imported
 */
export interface CAPWATCHFileImportedResult {
	type: CAPWATCHImportUpdateType.FileImported;
	error: CAPWATCHImportErrors;
	file: string;
	currentStep: number;
}

/**
 * Shows which file in the CAPWATCH bundle has been fully imported
 */
export interface CAPWATCHFileDoneResult {
	type: CAPWATCHImportUpdateType.CAPWATCHFileDone;
	currentStep: number;
}

/**
 * Communicates how many steps the server will be communicating
 */
export interface CAPWATCHProgressInitialization {
	type: CAPWATCHImportUpdateType.ProgressInitialization;
	totalSteps: number;
}

export type CAPWATCHImportUpdate =
	| CAPWATCHFileDownloadedResult
	| CAPWATCHFileImportedResult
	| CAPWATCHFileDoneResult
	| CAPWATCHProgressInitialization
	| Messages;

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
