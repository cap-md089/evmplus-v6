import { FullFileObject, RawFileObject } from 'common-lib';
import { FileUserAccessControlPermissions } from 'common-lib/index';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/Members';
import { generateResults } from '../../../lib/MySQLUtil';
import Registry from '../../../lib/Registry';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArrayTyped } from '../../../lib/Util';

export default asyncErrorHandler(async (req: ConditionalMemberRequest<{ page: string }>, res) => {
	const page = parseInt(req.params.page, 10) || 0;
	const registry = await Registry.Get(req.account, req.mysqlx);

	const imageCollection = req.mysqlx.getCollection<RawFileObject>('Files');

	const find = imageCollection
		.find('forDisplay = true')
		.limit(
			registry.values.Website.PhotoLibraryImagesPerPage,
			registry.values.Website.PhotoLibraryImagesPerPage * page
		);

	await streamAsyncGeneratorAsJSONArrayTyped<RawFileObject, FullFileObject>(
		res,
		generateResults(find),
		async info => {
			const fullFile = await File.Get(info.id, req.account, req.mysqlx);

			if (!await fullFile.hasPermission(req.member, req.mysqlx, req.account, FileUserAccessControlPermissions.READ)) {
				return false;
			}

			return fullFile.toFullRaw();
		}
	);
});
