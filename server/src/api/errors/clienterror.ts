import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncRight,
	ClientErrorObject,
	destroy,
	errorGenerator,
	ErrorResolvedStatus,
	Errors,
	Maybe,
	Member,
	MemberReference,
	pipe,
	toReference,
} from 'common-lib';
import { addToCollection, collectResults } from 'server-common';

export const func: ServerAPIEndpoint<api.errors.ClientError> = req =>
	asyncRight(req.mysqlx.getCollection<Errors>('Errors'), errorGenerator('Could not get new ID'))
		.map(collection => collection.find('true').sort('id DESC').limit(1))
		.map(collectResults)
		.map(Maybe.fromArray)
		.map(Maybe.map<{ id: number }, number>(i => i.id + 1))
		.map(Maybe.orSome(1))
		.map<ClientErrorObject>(id => ({
			accountID: req.account.id,
			componentStack: req.body.componentStack,
			id,
			message: req.body.message,
			pageURL: req.body.pageURL,
			resolved: ErrorResolvedStatus.UNRESOLVED,
			stack: req.body.stack.map(item => ({
				name: item.name,
				filename: item.filename,
				line: item.line,
				column: item.column,
			})),
			timestamp: Date.now(),
			type: 'Client',
			user: pipe(
				Maybe.map<Member, MemberReference>(toReference),
				Maybe.orSome<MemberReference | null>(null)
			)(req.member),
		}))
		.map(addToCollection(req.mysqlx.getCollection<Errors>('Errors')))

		.map(destroy);

export default func;
