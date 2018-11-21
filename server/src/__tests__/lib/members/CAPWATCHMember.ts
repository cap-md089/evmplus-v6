import { join } from 'path';
import conftest from '../../../conf.test';
import ImportCAPWATCHFile from '../../../lib/ImportCAPWATCHFile';
import MemberBase, { CAPWATCHMember } from '../../../lib/Members';
import { getTestTools } from '../../../lib/Util';

describe('CAPWATCHMember', async () => {
	let j, mem: CAPWATCHMember;

	beforeAll(async done => {
		const { schema, account } = await getTestTools(conftest);
		for await (const i of ImportCAPWATCHFile(
			join(__dirname, '..', '..', 'CAPWATCH.zip'),
			schema,
			account.orgIDs[0],
			['Member.txt']
		)) {
			j = i;
		}

		done();

		return;
	});

	it('should get the member information', async () => {
		const { schema, account } = await getTestTools(conftest);

		mem = await CAPWATCHMember.Get(542488, account, schema);

		expect(mem.id).toEqual(542488);
		expect(mem.nameFirst).toEqual('Andrew');
	});

	it('should create the correct reference', async () => {
		const { schema, account } = await getTestTools(conftest);

		const reference = mem.getReference();

		const newMem = await MemberBase.ResolveReference(
			reference,
			account,
			schema
		);

		expect(newMem.matchesReference(reference)).toBeTruthy();
	});
});
