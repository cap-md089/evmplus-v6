import { HTTPRequestMethod, ServerErrorObject } from 'common-lib';
import { parse } from 'error-stack-parser';
import { NextFunction, Response } from 'express';
import MemberBase, { ConditionalMemberRequest } from '../../lib/Members';
import { generateResults } from '../../lib/MySQLUtil';

// @ts-ignore
interface MaybeMemberRequest extends ConditionalMemberRequest {
	member?: MemberBase | null;
}

export default async (err: Error, req: MaybeMemberRequest, res: Response, next: NextFunction) => {
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
			payload: req.body,
			accountID: req.account.id,

			message: err.message,
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

	// End the connection
	// Even though the error is handled, there is still an error and the
	// client shouldn't expect a result
	// However, to indicate that the error is recorded and may be fixed later
	// there is a non-standard header attached
	res.status(500);
	res.set('x-error-handled', 'true');
	res.end();
};
