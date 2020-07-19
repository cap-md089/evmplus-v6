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
import { accountRequestTransformer, downloadFileObject, getFileObject, PAM } from 'server-common';
import asyncErrorHandler from '../../../lib/asyncErrorHandler';

const canReadFile = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func = () =>
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
			res.end();
			await req.mysqlxSession.close();
			return;
		}

		// const fileRequested = createReadStream(
		// 	join(req.configuration.DRIVE_STORAGE_PATH, file.accountID + '-' + file.id)
		// );

		res.contentType(file.contentType);
		res.setHeader('Content-Disposition', 'attachment; filename="' + file.fileName + '"');

		await req.mysqlxSession.close();

		await downloadFileObject(req.configuration)(file)(res);

		res.end();
	});

export default func();
