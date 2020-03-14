import { Schema } from '@mysql/xdevapi';
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	ErrorResolvedStatus,
	Errors,
	none,
	NoSQLDocument
} from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	BasicMemberRequest,
	collectResults,
	findAndBind,
	memberRequestTransformer,
	serverErrorGenerator,
	SessionType
} from '../../lib/internals';

export const getErrors = (
	schema: Schema
): AsyncEither<api.ServerError, Array<Errors & Required<NoSQLDocument>>> =>
	asyncRight(
		schema.getCollection<Errors & Required<NoSQLDocument>>('Errors'),
		serverErrorGenerator('Could not get error list')
	)
		.map(collection => findAndBind(collection, { resolved: ErrorResolvedStatus.UNRESOLVED }))
		.map(find => collectResults(find));

export default asyncEitherHandler2<api.errors.GetErrors>(request =>
	asyncRight(request, serverErrorGenerator('Could not get errors'))
		.flatMap(Account.RequestTransformer)
		.flatMap(memberRequestTransformer(SessionType.REGULAR, true))
		.flatMap<BasicMemberRequest>(req =>
			req.member.isRioux
				? asyncRight(req, serverErrorGenerator('Could not get errors'))
				: asyncLeft({
						code: 403,
						error: none<Error>(),
						message: 'Member does not have the required permissions'
				  })
		)
		.map(req => req.mysqlx)
		.flatMap(getErrors)
		.map(errors =>
			errors.map(err => {
				const { _id, ...newError } = err;

				return newError;
			})
		)
);
