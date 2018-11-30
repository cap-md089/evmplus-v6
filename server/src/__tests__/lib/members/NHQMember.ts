import { Schema } from '@mysql/xdevapi';
import conftest from '../../../conf.test';
import Account from '../../../lib/Account';
import { NHQMember } from '../../../lib/Members';
import { getTestTools } from '../../../lib/Util';
import { signinInformation } from '../../consts';

describe('NHQ Member', () => {
	let mem: NHQMember;
	let account: Account;
	let schema: Schema;

	beforeAll(async done => {
		const results = await getTestTools(conftest);

		account = results.account;
		schema = results.schema;

		done();
	});

	describe('Member fetch operations', () => {
		it('should create a member successfully', async done => {
			mem = await NHQMember.Create(
				signinInformation.username,
				signinInformation.password,
				schema,
				account
			);

			expect(mem.id).toEqual(signinInformation.username);

			done();
		}, 8500);
	});

	describe('Member functions', () => {
		it('should return a correctly parsed name', () => {
			expect(mem.getName()).toEqual('Andrew D Rioux');
		});
	});
});
