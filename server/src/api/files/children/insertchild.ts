import { just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, File } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberRequest<{ parentid: string }>) => {
	const parentid = req.params.parentid;
	const childid = req.body.id;

	let child, parent, oldparent;

	try {
		[child, parent] = await Promise.all([
			File.Get(childid, req.account, req.mysqlx),
			File.Get(parentid, req.account, req.mysqlx)
		]);
	} catch (e) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Could not find either the child or the parent'
		});
	}

	try {
		oldparent = await child.getParent();
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not unlink from old parent'
		});
	}

	oldparent.removeChild(child);

	try {
		await parent.addChild(child);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not add child to parent'
		});
	}

	try {
		await Promise.all([oldparent.save(), child.save(), parent.save()]);
	} catch (e) {
		return left({
			code: 500,
			error: just(e),
			message: 'Could not save information for files'
		});
	}

	return right(void 0);
});
