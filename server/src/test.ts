import conftest from './conf.test';
import { getTestTools, ImportCAPWATCHFile } from './lib/internals';

(async () => {
	const { schema, session } = await getTestTools(conftest);

	const capImport2 = ImportCAPWATCHFile(
		'/home/arioux/Downloads/2018-12-12_546319-890.zip',
		schema,
		session,
		2529,
		['Organization.txt', 'OFlight.txt']
	);

	for await (const i of capImport2) {
		console.log(i);
	}

	const capImport = ImportCAPWATCHFile(
		'/home/arioux/Downloads/2018-12-12_546319-089.zip',
		schema,
		session,
		916,
		['Organization.txt', 'OFlight.txt']
	);

	for await (const i of capImport) {
		console.log(i);
	}

	process.exit();
})();
