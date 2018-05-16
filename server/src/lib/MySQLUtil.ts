import * as mysql from 'promise-mysql';
import * as express from 'express';

export interface MySQLRequest extends express.Request {
	connectionPool: mysql.Pool;
}

export default (pool: mysql.Pool): express.RequestHandler => {
	return (req: MySQLRequest, res, next) => {
		req.connectionPool = pool;
		next();
	};
};

export const errorFunction = (response: express.Response) => {
	return (err: Error) => {
		response.status(500);
		response.end();
		console.log(err);
	};
};

export const prettySQL = (text: TemplateStringsArray): string => {
	return text[0].replace(/\n\t/g, '');
};