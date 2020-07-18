import * as express from 'express';
import { MySQLRequest } from 'server-common';
import saveServerError from './saveServerError';

export const asyncErrorHandler = (
	f: (req: MySQLRequest<any>, response: express.Response) => Promise<void>
) => (req: express.Request, response: express.Response) =>
	f((req as any) as MySQLRequest<any>, response).catch(async err => {
		await saveServerError(err, (req as any) as MySQLRequest<any>);

		await ((req as any) as MySQLRequest).mysqlxSession.close();
	});

export default asyncErrorHandler;
