import { join } from 'path';
import conftest from '../../../conf.test';
import ImportCAPWATCHFile from '../../../lib/ImportCAPWATCHFile';
import { CAPWATCHMember } from '../../../lib/Members';
import { getTestTools } from '../../../lib/Util';

describe('CAPWATCHMember', async () => {
	const { schema, account } = await getTestTools(conftest);

	beforeAll(() => {
		ImportCAPWATCHFile(
			join(__dirname, '..', '..', 'CAPWATCH.zip'),
			schema,
			account.orgIDs[0],
			['Member.txt']
		);
	});

	it('should get the member information', async done => {
		const mem = await CAPWATCHMember.Get(542488, account, schema);

		expect(mem.id).toEqual(542488);
		expect(mem.nameFirst).toEqual('Andrew');

		done();
	});
});
