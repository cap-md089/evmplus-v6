import { NextFunction, Response } from 'express';
import saveServerError, { Requests } from '../../lib/saveServerError';

export default async (err: Error, req: Requests, res: Response, next: NextFunction) => {
	if (!(err instanceof Error)) {
		await req.mysqlxSession.close();
		return next();
	}

	// There was an error formatting the JSON properly
	if (err.message.startsWith('Unexpected token ')) {
		await req.mysqlxSession.close();
		return next();
	}

	await saveServerError(err, req);

	await req.mysqlxSession.close();

	// End the connection
	// Even though the error is handled, there is still an error and the
	// client shouldn't expect a result
	// However, to indicate that the error is recorded and may be fixed later
	// there is a non-standard header attached
	res.status(500);
	res.set('x-error-handled', 'true');
	res.end();
};
