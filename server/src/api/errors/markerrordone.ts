import {
	api,
	areErrorObjectsTheSame,
	asyncLeft,
	asyncRight,
	ErrorResolvedStatus,
	Errors,
	ErrorType,
	none
} from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	BasicSimpleValidatedRequest,
	memberRequestTransformer,
	serverErrorGenerator,
	Validator
} from '../../lib/internals';
import { getErrors } from './geterrors';

interface MarkErrorDoneRequestBody {
	message: string;
	type: ErrorType;
	fileName: string;
	line: number;
	column: number;
}

const errorValidator = new Validator<MarkErrorDoneRequestBody>({
	column: {
		validator: Validator.Number
	},
	line: {
		validator: Validator.Number
	},
	fileName: {
		validator: Validator.String
	},
	type: {
		validator: Validator.OneOfStrict<ErrorType>('Client', 'Server')
	},
	message: {
		validator: Validator.String
	}
});

const errorHandler = serverErrorGenerator('Could not mark error as resolved');

export default asyncEitherHandler2<api.errors.MarkErrorAsDone>(request =>
	asyncRight(request, errorHandler)
		.flatMap(Account.RequestTransformer)
		.flatMap(memberRequestTransformer(false, true))
		.flatMap(errorValidator.transform)
		.flatMap<BasicSimpleValidatedRequest<MarkErrorDoneRequestBody>>(req =>
			req.member.isRioux
				? asyncRight(req, errorHandler)
				: asyncLeft({
						code: 403,
						message: 'Member is not a developer',
						error: none<Error>()
				  })
		)
		.flatMap(req =>
			asyncRight(
				({
					type: req.body.type,
					message: req.body.message,
					stack: [
						{
							column: req.body.column,
							line: req.body.line,
							filename: req.body.fileName
						}
					]
				} as unknown) as Errors,
				errorHandler
			)
				.flatMap(err =>
					asyncRight(req.mysqlx, errorHandler)
						.flatMap(getErrors)
						.map(errors =>
							errors.filter(areErrorObjectsTheSame(err)).map(error => error.id)
						)
				)
				.flatMap(errorIDs =>
					asyncRight(req.mysqlx.getCollection<Errors>('Errors'), errorHandler).map(
						collection =>
							collection
								.modify(`id in [${errorIDs.join(',')}]`)
								.patch({
									resolved: ErrorResolvedStatus.RESOLVED
								})
								// I was stupid with making the types. 95% of the time, it works great and to my
								// advantage. For taking advantage of the corner cases like here, not so much
								// .bind('errorIDs' as keyof Errors, (errorIDs as unknown) as string)
								.execute()
					)
				)
		)
		.map(() => void 0)
);
