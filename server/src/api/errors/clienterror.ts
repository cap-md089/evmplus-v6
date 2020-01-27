import {
	api,
	ClientErrorObject,
	ErrorObject,
	left,
	NewClientErrorObject,
	none,
	right
} from 'common-lib';
import {
	asyncEitherHandler,
	BasicConditionalMemberRequest,
	generateResults
} from '../../lib/internals';

export default asyncEitherHandler<api.errors.ClientError>(
	async (req: BasicConditionalMemberRequest) => {
		if (
			typeof req.body.timestamp !== 'number' ||
			typeof req.body.message !== 'string' ||
			typeof req.body.resolved !== 'boolean' ||
			req.body.type !== 'Client' ||
			!Array.isArray(req.body.stack) ||
			(req.body as ErrorObject).stack
				.map(
					stack =>
						typeof stack.name !== 'string' ||
						typeof stack.filename !== 'string' ||
						typeof stack.line !== 'number' ||
						typeof stack.column !== 'number'
				)
				.reduce((a, b) => a || b, false) ||
			typeof req.body.pageURL !== 'string' ||
			typeof req.body.componentStack !== 'string'
		) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Error object provided is invalid'
			});
		}

		const info = req.body as NewClientErrorObject;

		console.error('Client error!', info.message);

		const errorCollection = req.mysqlx.getCollection<ClientErrorObject>('ClientErrors');
		let id = 0;

		// Get the ID for the new error
		{
			const errorGenerator = generateResults(errorCollection.find('true'));

			for await (const error of errorGenerator) {
				id = Math.max(id, error.id);
			}

			id++;
		}

		// Add the error to the database
		{
			const errorObject: ClientErrorObject = {
				componentStack: info.componentStack,
				accountID: req.account.id,
				id,
				pageURL: info.pageURL,
				type: 'Client',
				stack: info.stack.map(item => ({
					name: item.name,
					filename: item.filename,
					line: item.line,
					column: item.column
				})),
				resolved: false,
				message: info.message,
				timestamp: Date.now(),
				user: req.member ? req.member.getReference() : null
			};

			await errorCollection.add(errorObject).execute();

			return right(errorObject);
		}
	}
);
