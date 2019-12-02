import { just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, File } from '../../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicMemberRequest<{ parentid: string; childid: string }>) => {
		const parentid = req.params.parentid;
		const childid = req.params.childid;

		let parent: File;
		let child: File;

		try {
			[parent, child] = await Promise.all([
				File.Get(parentid, req.account, req.mysqlx),
				File.Get(childid, req.account, req.mysqlx)
			]);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find either the parent or the child'
			});
		}

		parent.removeChild(child);

		try {
			await Promise.all([parent.save(), child.save()]);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save information for files'
			});
		}

		return right(void 0);
	}
);
