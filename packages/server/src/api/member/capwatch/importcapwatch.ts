/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

// import { ServerAPIEndpoint } from 'auto-client-api';
// import {
// 	api,
// 	AsyncEither,
// 	asyncIterMap,
// 	asyncRight,
// 	CAPNHQMemberObject,
// 	CAPWATCHImportUpdate,
// 	collectGeneratorAsync,
// 	errorGenerator,
// 	Maybe,
// 	SessionType,
// } from 'common-lib';
// import { CAP, ImportCAPWATCHFile, PAM } from 'server-common';

// const orDefaultFiles = Maybe.orSome([
// 	'Member.txt',
// 	'DutyPosition.txt',
// 	'MbrContact.txt',
// 	'CadetDutyPositions.txt',
// 	'CadetActivities.txt',
// 	'OFlight.txt',
// 	'MbrAchievements.txt',
//  'CadetAchv.txt',
//  'CadetAchvAprs.txt',
//  'CdtAchvEnum.txt',
// ]);

// export const func: ServerAPIEndpoint<api.member.capwatch.RequestImport> = PAM.RequiresPermission(
// 	'DownloadCAPWATCH'
// )(
// 	PAM.RequireSessionType(SessionType.REGULAR)(
// 		PAM.RequiresMemberType('CAPNHQMember')(req =>
// 			asyncRight(
// 				orDefaultFiles(Maybe.fromValue(req.body.files)),
// 				errorGenerator('Could not process request')
// 			)
// 				.flatMap(() =>
// 					AsyncEither.All(
// 						req.body.orgIDs.map(id =>
// 							CAP.downloadCAPWATCHFile(req.configuration)(
// 								id,
// 								(req.member as CAPNHQMemberObject).id,
// 								req.body.password
// 							).map<[number, string]>(filePath => [id, filePath])
// 						)
// 					)
// 				)
// 				.map(
// 					asyncIterMap(filePath =>
// 						collectGeneratorAsync(
// 							ImportCAPWATCHFile(filePath[1], req.mysqlx, req.mysqlxSession)
// 						)
// 					)
// 				)
// 				.map(collectGeneratorAsync)
// 				.map(results =>
// 					results.flatMap<api.member.capwatch.CAPWATCHFileImportedResult>(
// 						(resultList, index) =>
// 							resultList.map(result => ({
// 								type: CAPWATCHImportUpdate.FileImported,
// 								orgID: req.body.orgIDs[index],
// 								error: result.error,
// 								file: result.file,
// 							}))
// 					)
// 				)
// 				.tap(() => {
// 					req.memberUpdateEmitter.emit('capwatchImport', req.account);
// 				})
// 		)
// 	)
// );

// export default func;
