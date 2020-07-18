import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	areErrorObjectsTheSame,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	collectGeneratorAsync,
	destroy,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	get,
	SessionType,
} from 'common-lib';
import { isRequesterRioux, PAM } from 'server-common';
import { getErrors } from './geterrors';

const errorHandler = errorGenerator('Could not mark error as resolved');

export const func: ServerAPIEndpoint<api.errors.MarkErrorAsDone> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	asyncRight(request, errorHandler)
		.filter(isRequesterRioux, {
			type: 'OTHER',
			code: 403,
			message: 'Member is not a developer',
		})
		.flatMap(req =>
			asyncRight(
				({
					type: req.body.type,
					message: req.body.message,
					stack: [
						{
							column: req.body.column,
							line: req.body.line,
							filename: req.body.fileName,
						},
					],
				} as unknown) as Errors,
				errorHandler
			)
				.flatMap(err =>
					getErrors(req.mysqlx)
						.map(asyncIterFilter(areErrorObjectsTheSame(err)))
						.map(asyncIterMap(get('id')))
				)
				.map(collectGeneratorAsync)
				.map(errorIDs =>
					req.mysqlx
						.getCollection<Errors>('Errors')
						.modify(`id in [${errorIDs.join(',')}]`)
						.patch({
							resolved: ErrorResolvedStatus.RESOLVED,
						})
						.execute()
				)
				.map(destroy)
		)
);

export default func;
