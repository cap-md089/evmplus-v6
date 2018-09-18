import { getSession } from '@mysql/xdevapi';
import conf from './conf';
import { generateResults } from './lib/MySQLUtil';

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

	const collection = mysqlSchema.getCollection<NHQ.Member>('NHQ_Member');

	const find = collection.find('true');

	const mysqlIterator = generateResults(find);

	let count = 0;

	for await (const result of mysqlIterator) {
		console.log(result.CAPID);
		count++;
	}

	console.log('Verify against `SELECT COUNT(*) FROM NHQ_Member;`');
	console.log(count);

	process.exit();
});
