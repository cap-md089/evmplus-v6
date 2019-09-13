import conf from './conf';
import { getTestTools, ImportCAPWATCHFile } from './lib/internals';

(async () => {
	const { schema, session } = await getTestTools(conf);

	const capImport2 = ImportCAPWATCHFile(
		'/home/arioux/Downloads/2018-12-12_546319-890.zip',
		schema,
		session,
		2529,
		['Member.txt']
	);

	for await (const i of capImport2) {
		console.log(i);
	}

	const capImport = ImportCAPWATCHFile(
		'/home/arioux/Downloads/2018-12-12_546319-089.zip',
		schema,
		session,
		916,
		['Member.txt']
	);

	for await (const i of capImport) {
		console.log(i);
	}

	process.exit();
})();
