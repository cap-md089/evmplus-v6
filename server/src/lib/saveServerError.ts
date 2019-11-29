import { HTTPRequestMethod, ServerErrorObject } from 'common-lib';
import { parse } from 'error-stack-parser';
import { ConditionalMemberRequest } from './member/pam/Session';
import { generateResults } from './MySQLUtil';

export default async (err: Error, req: ConditionalMemberRequest) => {
	console.error(err);

	const errorCollection = req.mysqlx.getCollection<ServerErrorObject>('ServerErrors');
	let id = 0;

	// Create the ID of the new error
	{
		const errorGenerator = generateResults(errorCollection.find('true'));

		for await (const error of errorGenerator) {
			id = Math.max(id, error.id);
		}

		id++;
	}

	// Add the error to the database
	{
		const stacks = parse(err);

		const errorObject: ServerErrorObject = {
			id,

			requestedPath: req._originalUrl,
			requestedUser: req.member ? req.member.getReference() : null,
			requestMethod: req.method.toUpperCase() as HTTPRequestMethod,
			payload: JSON.stringify(req.body) || '<none>',
			accountID: req.account.id,

			message: err.message || '<none>',
			stack: stacks.map(stack => ({
				filename: stack.getFileName(),
				line: stack.getLineNumber(),
				column: stack.getColumnNumber(),
				name: stack.getFunctionName() || '<unknown>'
			})),
			filename: stacks[0].getFileName(),

			timestamp: Date.now(),
			resolved: false,
			type: 'Server'
		};

		await errorCollection.add(errorObject).execute();
	}
};
