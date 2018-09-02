import conftest from '../../../conf.test';
import { NHQMember } from '../../../lib/MemberBase';
import { getTestTools } from '../../../lib/Util';

const signinInformation = {
	username: 542488,
	password: 'app/xPHP091101'
};

describe('NHQ Member', () => {
	let mem: NHQMember;

	describe('Member fetch operations', () => {
		it('should create a member successfully', async done => {
			const { account, schema } = await getTestTools(conftest);

			mem = await NHQMember.Create(
				signinInformation.username,
				signinInformation.password,
				schema,
				account
			);

			expect(mem.id).toEqual(signinInformation.username);

			done();
		});
	});

	describe('Member functions', () => {
		it('should return a correctly parsed name', () => {
			expect(mem.getName()).toEqual('Andrew D Rioux');
		});
	});
});
