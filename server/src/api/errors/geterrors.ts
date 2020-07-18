import { Schema } from '@mysql/xdevapi';
import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	SessionType,
} from 'common-lib';
import { findAndBindC, generateResults, isRequesterRioux, PAM } from 'server-common';

export const getErrors = (schema: Schema) =>
	asyncRight(
		schema.getCollection<Errors>('Errors'),
		errorGenerator('Could not get error objects')
	)
		.map(
			findAndBindC<Errors>({ resolved: ErrorResolvedStatus.UNRESOLVED })
		)
		.map(generateResults);

export const func: ServerAPIEndpoint<api.errors.GetErrors> = PAM.RequireSessionType(
	SessionType.REGULAR
)(request =>
	asyncRight(request, errorGenerator('Could not get error list'))
		.filter(isRequesterRioux, {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have the required permissions',
		})
		.flatMap(req => getErrors(req.mysqlx))
);

export default func;
