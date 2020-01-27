import conf from './conf';
import { getTestTools, ImportCAPWATCHFile } from './lib/internals';

(async () => {
	const { schema, session } = await getTestTools(conf);

	const capImport2 = ImportCAPWATCHFile(
		'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-089.zip',
		schema,
		session,
		2529
	);

	for await (const i of capImport2) {
		console.log(i);
	}

	const capImport = ImportCAPWATCHFile(
		'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-890.zip',
		schema,
		session,
		916
	);

	for await (const i of capImport) {
		console.log(i);
	}

	process.exit();
})();
