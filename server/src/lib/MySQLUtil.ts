import * as express from 'express';
import * as mysql from 'promise-mysql';

export interface MySQLRequest extends express.Request {
	connectionPool: mysql.Pool;
	_originalUrl: string;
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
		// tslint:disable-next-line:no-console
		console.log(err);
	};
};

export const prettySQL = (text: TemplateStringsArray): string => {
	return text[0].replace(/[\n\t]/g, ' ').replace(/ +/g, ' ');
};