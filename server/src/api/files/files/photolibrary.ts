import { FileUserAccessControlPermissions, FullFileObject, RawFileObject } from 'common-lib';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	File,
	generateResults,
	Registry,
	streamAsyncGeneratorAsJSONArrayTyped
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: ConditionalMemberRequest<{ page: string }>, res) => {
	const page = parseInt(req.params.page, 10) || 0;
	const registry = await Registry.Get(req.account, req.mysqlx);

	const imageCollection = req.mysqlx.getCollection<RawFileObject>('Files');

	const find = imageCollection
		.find('forDisplay = true')
		.limit(-1, registry.values.Website.PhotoLibraryImagesPerPage * page);

	let count = 0;

	await streamAsyncGeneratorAsJSONArrayTyped<RawFileObject, FullFileObject>(
		res,
		generateResults(find),
		async info => {
			const fullFile = await File.Get(info.id, req.account, req.mysqlx);

			if (
				count > registry.values.Website.PhotoLibraryImagesPerPage ||
				!(await fullFile.hasPermission(
					req.member,
					req.mysqlx,
					req.account,
					FileUserAccessControlPermissions.READ
				))
			) {
				return false;
			}

			count++;

			return fullFile.toFullRaw();
		}
	);
});
