import {
	BasicMySQLRequest,
	Either,
	FileUserAccessControlPermissions,
	Maybe,
	MaybeObj,
	RawFileObject,
	SessionType,
	User,
	userHasFilePermission,
} from 'common-lib';
import * as fs from 'fs';
import { accountRequestTransformer, downloadFileObject, getFileObject, PAM } from 'server-common';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';

const canReadFile = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func = (createReadStreamFunc = fs.createReadStream) =>
	asyncErrorHandler(async (req: BasicMySQLRequest<{ fileid: string }>, res) => {
		const fileEither = await accountRequestTransformer(req)
			.flatMap(PAM.memberRequestTransformer(SessionType.REGULAR, false))
			.flatMap(request =>
				getFileObject(true)(req.mysqlx)(request.account)(request.params.fileid).map<
					[RawFileObject, MaybeObj<User>]
				>(f => [f, request.member])
			)
			.join();

		if (Either.isLeft(fileEither)) {
			res.status(fileEither.value.code);
			res.end();

			if (fileEither.value.type === 'CRASH') {
				throw fileEither.value.error;
			}

			await req.mysqlxSession.close();

			return;
		}

		const [file, member] = fileEither.value;

		if (!canReadFile(Maybe.orSome<null | User>(null)(member))(file)) {
			res.status(403);
			await req.mysqlxSession.close();
			return res.end();
		}

		await req.mysqlxSession.close();

		await downloadFileObject(req.configuration)(file)(res);
	});

export default func();
