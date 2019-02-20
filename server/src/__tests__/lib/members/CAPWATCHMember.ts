import { Schema } from '@mysql/xdevapi';
import { CAPWATCHImportErrors } from 'common-lib/index';
import { join } from 'path';
import conftest from '../../../conf.test';
import Account from '../../../lib/Account';
import ImportCAPWATCHFile from '../../../lib/ImportCAPWATCHFile';
import MemberBase, { CAPWATCHMember } from '../../../lib/Members';
import { Admin as AdminPermissions, Member as NoPermissions } from '../../../lib/Permissions';
import { getTestTools } from '../../../lib/Util';

describe('CAPWATCHMember', async () => {
	let mem: CAPWATCHMember;
	let account: Account;
	let schema: Schema;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		account = results.account;
		schema = results.schema;

		for await (const i of ImportCAPWATCHFile(
			join(__dirname, '..', '..', 'CAPWATCH.zip'),
			schema,
			account.orgIDs[0],
			['Member.txt']
		)) {
			expect(i.error).toEqual(CAPWATCHImportErrors.NONE);
		}

		done();

		return;
	});

	it('should get the member information', async () => {
		mem = await CAPWATCHMember.Get(542488, account, schema);

		expect(mem.id).toEqual(542488);
		expect(mem.nameFirst).toEqual('Andrew');
	});

	it('should create the correct reference', async () => {
		const reference = mem.getReference();

		const newMem = await MemberBase.ResolveReference(reference, account, schema);

		expect(newMem.matchesReference(reference)).toBeTruthy();
	});

	it('should be able to generate accounts', async () => {
		for await (const acc of mem.getAccounts()) {
			expect(acc.orgIDs.indexOf(mem.orgid)).toBeGreaterThan(-1);
		}
	});

	it('should get the correct name', () => {
		expect(mem.getName()).toEqual('Andrew D Rioux');
	});

	it('should check for permissions', async done => {
		expect(mem.hasPermission('AddEvent')).toBe(true);

		const permissionLessMember = await CAPWATCHMember.Get(535799, account, schema);

		permissionLessMember.permissions = NoPermissions;

		expect(permissionLessMember.hasPermission('AddEvent')).toBe(false);

		mem.permissions = AdminPermissions;

		done();
	});

	it('should get the correct user id', () => {
		expect(CAPWATCHMember.GetUserID(['Andrew', 'D', 'Rioux'])).toEqual('riouxad');
	});

	it('should verify references correctly', () => {
		expect(
			CAPWATCHMember.isReference({
				id: 'string',
				type: 'CAPNHQMember'
			})
		).toBe(false);

		expect(
			CAPWATCHMember.isReference({
				id: 'string',
				type: 'CAPProspectiveMember'
			})
		).toBe(true);

		expect(
			CAPWATCHMember.isReference({
				id: 4,
				type: 'CAPNHQMember'
			})
		).toBe(true);

		expect(
			CAPWATCHMember.isReference({
				id: 'whatever',
				type: 'Null'
			})
		).toBe(true);
	});
});
