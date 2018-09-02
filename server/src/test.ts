import { getSession } from '@mysql/xdevapi';
import conf from './conf';
import importCAPWATCHFile, { CAPWATCHError } from './lib/ImportCAPWATCHFile';

const {
	database: schema,
	host,
	password,
	port,
	user
} = conf.database.connection;

getSession({
	host,
	password,
	port,
	user
}).then(async sess => {
	const mysqlSchema = sess.getSchema(schema);

	const capwatchIterator = importCAPWATCHFile(
		'/home/arioux/Downloads/2018-04-11_546319-089.zip',
		mysqlSchema,
		916
	)

	for await (const result of capwatchIterator) {
		console.log({
			...result,
			errorCode: CAPWATCHError[result.error]
		});
	}

	process.exit();
});
