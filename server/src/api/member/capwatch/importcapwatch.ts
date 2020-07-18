import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	asyncIterMap,
	asyncRight,
	CAPNHQMemberObject,
	CAPWATCHImportUpdate,
	collectGeneratorAsync,
	errorGenerator,
	Maybe,
	SessionType,
} from 'common-lib';
import { CAP, ImportCAPWATCHFile, PAM } from 'server-common';

const orDefaultFiles = Maybe.orSome([
	'Member.txt',
	'DutyPosition.txt',
	'MbrContact.txt',
	'CadetDutyPositions.txt',
	'CadetActivities.txt',
	'OFlight.txt',
	'MbrAchievements.txt',
]);

export const func: ServerAPIEndpoint<api.member.capwatch.RequestImport> = PAM.RequiresPermission(
	'DownloadCAPWATCH'
)(
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresMemberType('CAPNHQMember')(req =>
			asyncRight(
				orDefaultFiles(Maybe.fromValue(req.body.files)),
				errorGenerator('Could not process request')
			)
				.flatMap(() =>
					AsyncEither.All(
						req.body.orgIDs.map(id =>
							CAP.downloadCAPWATCHFile(req.configuration)(
								id,
								(req.member as CAPNHQMemberObject).id,
								req.body.password
							).map<[number, string]>(filePath => [id, filePath])
						)
					)
				)
				.map(
					asyncIterMap(filePath =>
						collectGeneratorAsync(
							ImportCAPWATCHFile(filePath[1], req.mysqlx, req.mysqlxSession)
						)
					)
				)
				.map(collectGeneratorAsync)
				.map(results =>
					results.flatMap<api.member.capwatch.CAPWATCHFileImportedResult>(
						(resultList, index) =>
							resultList.map(result => ({
								type: CAPWATCHImportUpdate.FileImported,
								orgID: req.body.orgIDs[index],
								error: result.error,
								file: result.file,
							}))
					)
				)
				.tap(() => {
					req.memberUpdateEmitter.emit('capwatchImport', req.account);
				})
		)
	)
);

export default func;
