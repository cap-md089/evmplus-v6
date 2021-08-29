/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
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

import { Client } from '@mysql/xdevapi';
import {
	AccountType,
	always,
	api,
	BasicMySQLRequest,
	CAPWATCHImportRequestType,
	CAPWATCHImportUpdateType,
	Either,
	FileUserAccessControlPermissions,
	getORGIDsFromRegularCAPAccount,
	hasPermission,
	Left,
	Maybe,
	MemberUpdateEventEmitter,
	Permissions,
	RegularCAPAccountObject,
	ServerConfiguration,
	ServerError,
	sockets,
	User,
	userHasFilePermission,
} from 'common-lib';
import { parse } from 'cookie';
import { join } from 'path';
import { createStore } from 'redux';
import {
	AccountBackend,
	accountRequestTransformer,
	Backends,
	bindForArray,
	CAP,
	combineBackends,
	getCombinedMemberBackend,
	getFileBackend,
	getRawMySQLBackend,
	ImportCAPWATCHFile,
	MemberBackend,
	MySQLRequest,
	PAM,
	RawMySQLBackend,
	TeamsBackend,
	TimeBackend,
} from 'server-common';
import type { Server, Socket } from 'socket.io';
import saveServerError from '../../../lib/saveServerError';

const orgidQuerySQL = (conf: ServerConfiguration, orgids: number[]): string => /* sql */ `\
WITH RECURSIVE Units AS (
        SELECT
                doc ->> '$.ORGID' as id,
                doc ->> '$.Name' as name,
                doc ->> '$.NextLevel' as parent
        FROM
                ${conf.DB_SCHEMA}.NHQ_Organization
        WHERE
                doc ->> '$.ORGID' in ${bindForArray(orgids)}
        UNION ALL
        SELECT
                O.doc ->> '$.ORGID',
                O.doc ->> '$.Name',
                O.doc ->> '$.NextLevel'
        FROM Units AS U
        JOIN ${conf.DB_SCHEMA}.NHQ_Organization AS O
        ON O.doc ->> '$.NextLevel' = U.id
)
SELECT id FROM Units;`;

const files = [
	'Member.txt',
	'DutyPosition.txt',
	'MbrContact.txt',
	'CadetDutyPositions.txt',
	'CadetActivities.txt',
	'OFlight.txt',
	'MbrAchievements.txt',
	'CadetAchv.txt',
	'CadetAchvAprs.txt',
	'CadetHFZInformation.txt',
];

interface WaitingState {
	state: 'Waiting';
}

interface DeniedState {
	state: 'Denied';
}

interface AuthorizedState {
	state: 'Authorized';
	member: User;
	account: RegularCAPAccountObject;
}

interface ImportingState {
	state: 'Importing';
}

type State = WaitingState | DeniedState | AuthorizedState | ImportingState;

interface AuthenticateAction {
	type: CAPWATCHImportRequestType.Authenticate;
	member: User;
	account: RegularCAPAccountObject;
}

interface ImportAction {
	type: CAPWATCHImportRequestType.ImportFile;
}

type Actions = AuthenticateAction | ImportAction;

const defaultState: State = {
	state: 'Waiting',
};

const reducer = (state: State = defaultState, action: Actions): State => {
	switch (action.type) {
		case CAPWATCHImportRequestType.Authenticate:
			if (state.state === 'Waiting') {
				if (
					hasPermission('DownloadCAPWATCH')(Permissions.DownloadCAPWATCH.YES)(
						action.member,
					)
				) {
					return {
						state: 'Authorized',
						member: action.member,
						account: action.account,
					};
				} else {
					return {
						state: 'Denied',
					};
				}
			}
			break;

		case CAPWATCHImportRequestType.ImportFile:
			if (state.state === 'Authorized') {
				return {
					state: 'Importing',
				};
			}
			break;
	}

	return state;
};

const emitResult = (socket: Socket) => (result: api.member.capwatch.CAPWATCHImportUpdate): void =>
	void socket.emit('result', result);

const handleError = (socket: Socket, error: Left<ServerError>): void => {
	socket.emit('result', {
		type: 'Error',
		message: error.value.message,
	});

	socket.disconnect();

	if (error.value.type === 'CRASH') {
		throw error.value.error;
	}
};

export const setupCapwatchImporter = (
	conf: ServerConfiguration,
	mysqlConn: Client,
	io: Server,
	capwatchUpdateEmitter: MemberUpdateEventEmitter,
): void => {
	const namespace = sockets.getServerNamespace('member:capwatch:importcapwatch', io);

	namespace.on('connection', async socket => {
		const resultsEmitter = emitResult(socket);

		const store = createStore(reducer);

		const request = (socket.request as unknown) as MySQLRequest;

		const session = await mysqlConn.getSession();

		request.mysqlx = session.getSchema(conf.DB_SCHEMA);
		request.memberUpdateEmitter = capwatchUpdateEmitter;
		request.mysqlxSession = session;
		request.configuration = conf;
		request._originalUrl = request.originalUrl;
		request.hostname = request.headers.host ?? request.hostname;

		const backend = combineBackends<
			MySQLRequest,
			[
				RawMySQLBackend,
				Backends<
					[AccountBackend, CAP.CAPMemberBackend, TimeBackend, TeamsBackend, MemberBackend]
				>,
			]
		>(
			getRawMySQLBackend,
			always(getCombinedMemberBackend()(request)),
		)(request);

		socket.on('disconnect', async () => {
			if (store.getState().state === 'Waiting') {
				await session.close();
			}
		});

		socket.on('importfile', async (fileid: string) => {
			const state = store.getState();

			if (state.state === 'Waiting' || state.state === 'Importing') {
				return;
			}

			if (state.state !== 'Authorized') {
				resultsEmitter({ type: 'Denied' });
				socket.disconnect();
				return await session.close();
			}

			const fileBackend = getFileBackend(request, backend);
			const fileResult = await fileBackend.getFileObject(state.account)(
				Maybe.some(state.member),
			)(fileid);

			if (Either.isLeft(fileResult)) {
				return handleError(socket, fileResult);
			}

			if (
				!userHasFilePermission(FileUserAccessControlPermissions.READ)(state.member)(
					fileResult.value,
				)
			) {
				resultsEmitter({ type: 'Denied' });
				socket.disconnect();
				return await session.close();
			}

			store.dispatch({ type: CAPWATCHImportRequestType.ImportFile });

			// files.length + 3 includes all the files as well as the 'downloaded', file imported, and zip file done events
			resultsEmitter({
				type: CAPWATCHImportUpdateType.ProgressInitialization,
				totalSteps: files.length + 2,
			});

			resultsEmitter({
				type: CAPWATCHImportUpdateType.CAPWATCHFileDownloaded,
				currentStep: 0,
			});

			const orgids = (
				await session
					.sql(orgidQuerySQL(conf, getORGIDsFromRegularCAPAccount(state.account)))
					.bind(getORGIDsFromRegularCAPAccount(state.account))
					.execute()
			)
				.fetchAll()
				.map(([value]: [number]) => value);

			const iter = ImportCAPWATCHFile(
				join(conf.DRIVE_STORAGE_PATH, `${fileResult.value.accountID}-${fileid}`),
				request.mysqlx,
				session,
				files,
				orgids,
			);

			let step = 1;

			for await (const result of iter) {
				if (result.type === 'Result') {
					console.log(result);
					resultsEmitter({
						type: CAPWATCHImportUpdateType.FileImported,
						currentStep: step++,
						error: result.error,
						file: result.file,
					});
				} else if (result.type === 'PermsError') {
					resultsEmitter({
						type: CAPWATCHImportUpdateType.CancelledPermsIssue,
						capid: result.capid,
						memberName: result.memberName,
					});
				} else {
					resultsEmitter({
						type: CAPWATCHImportUpdateType.FileProgress,
						currentRecord: result.currentRecord,
						recordCount: result.recordCount,
					});
				}
			}

			resultsEmitter({
				type: CAPWATCHImportUpdateType.CAPWATCHFileDone,
				currentStep: step++,
			});

			socket.disconnect();

			capwatchUpdateEmitter.emit('capwatchImport', state.account);

			await session.close();
		});

		try {
			const authCookie: string | undefined = parse(socket.request.headers.cookie ?? '')
				.sessionID;

			const accountRequest = await accountRequestTransformer(
				(socket.request as any) as BasicMySQLRequest,
			);

			if (Either.isLeft(accountRequest)) {
				return handleError(socket, accountRequest);
			}

			const account = accountRequest.value.account;

			if (account.type === AccountType.CAPEVENT) {
				return handleError(
					socket,
					Either.left({
						type: 'OTHER',
						code: 400,
						message: 'Cannot import CAPWATCH files for an event account',
					}),
				);
			}

			const memberSessionResult = await PAM.getMemberSessionFromCookie(backend)(
				accountRequest.value.account,
			)(authCookie);

			if (Either.isLeft(memberSessionResult)) {
				return handleError(socket, memberSessionResult);
			}

			store.dispatch({
				type: CAPWATCHImportRequestType.Authenticate,
				member: memberSessionResult.value.user,
				account,
			});

			if (store.getState().state === 'Denied') {
				resultsEmitter({
					type: 'Denied',
				});
				socket.disconnect();
			} else {
				resultsEmitter({
					type: 'ImportReady',
				});
			}
		} catch (e) {
			await saveServerError(e, request);
			await session.close();
		}
	});
};

export default setupCapwatchImporter;
