import * as mysql from '@mysql/xdevapi';
import * as express from 'express';

export interface MySQLRequest extends express.Request {
	mysqlx: mysql.Schema;
	_originalUrl: string;
}

export default (pool: mysql.Schema): express.RequestHandler => {
	return (req: MySQLRequest, res, next) => {
		req.mysqlx = pool;
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

export const collectResults = async <T>(find: mysql.CollectionFind<T> | mysql.TableSelect<T>): Promise<T[]> => {
	const ret: T[] = [];

	// The promise is resolved once the execute callback is called multiple times
	await find.execute(item => {
		ret.push(item);
	});

	return ret;
}

export const findAndBind = <T>(find: mysql.Collection<T>, bind: Partial<T>): mysql.CollectionFind<T> => 
	find
		.find(Object.keys(bind).map(val => `${val} = :${val}`).join(' AND '))
		.bind(bind)

export const modifyAndBind = <T>(modify: mysql.Collection<T>, bind: Partial<T>): mysql.CollectionModify<T> => 
	modify
		.modify(Object.keys(bind).map(val => `${val} = :${val}`).join(' AND '))
		.bind(bind)