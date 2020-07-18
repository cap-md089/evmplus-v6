import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	FileObject,
	FileUserAccessControlPermissions,
	get,
	RawFileObject,
	Right,
	ServerError,
	userHasFilePermission,
} from 'common-lib';
import { expandRawFileObject, findAndBindC, generateResults } from 'server-common';

export const func: ServerAPIEndpoint<api.SlideshowImageIDs> = req =>
	asyncRight(req.mysqlx.getCollection<RawFileObject>('Files'), errorGenerator('Could not get '))
		.map(
			findAndBindC<RawFileObject>({
				forSlideshow: true,
				accountID: req.account.id,
			})
		)
		.map(generateResults)
		.map(asyncIterFilter(userHasFilePermission(FileUserAccessControlPermissions.READ)(null)))
		.map(asyncIterMap(expandRawFileObject(req.mysqlx)(req.account)))
		.map(asyncIterFilter<EitherObj<ServerError, FileObject>, Right<FileObject>>(Either.isRight))
		.map(asyncIterMap(get('value')));

export default func;
