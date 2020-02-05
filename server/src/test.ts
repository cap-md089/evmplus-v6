import { RawEventObject } from 'common-lib';
import conf from './conf';
import { collectResults, deleteAllGoogleCalendarEvents, findAndBind, getTestTools } from './lib/internals';

(async () => {
	const { account, schema } = await getTestTools(conf);

	// const capImport2 = ImportCAPWATCHFile(
	// 	'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-089.zip',
	// 	schema,
	// 	session,
	// 	2529
	// );

	// for await (const i of capImport2) {
	// 	console.log(i);
	// }import { newEvent as myRawEvent } from './__tests__/consts';

	// const capImport = ImportCAPWATCHFile(
	// 	'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-890.zip',
	// 	schema,
	// 	session,
	// 	916
	// );

	// for await (const i of capImport) {
	// 	console.log(i);
	// }

	await deleteAllGoogleCalendarEvents(account);
	const eventsCollection = schema.getCollection<RawEventObject>('Events');

	const idResults = await collectResults(
		findAndBind(eventsCollection, {
			accountID: account.id
		})
	);
	console.log("idResults ", idResults);


	process.exit();
})();

