import { MemberCreateError } from 'common-lib/index';
import authenticate from '../../../../lib/members/pam/nhq-authenticate';
import nhqGetcapid from '../../../../lib/members/pam/nhq-getcapid';
import nhqGetcontact from '../../../../lib/members/pam/nhq-getcontact';
import nhqGetname from '../../../../lib/members/pam/nhq-getname';
import nhqRequest from '../../../../lib/members/pam/nhq-request';

const signinInformation = {
	username: '542488',
	password: 'app/xPHP091101'
};

describe('pluggable authentication modules', () => {
	describe('nhq', () => {
		let cookie: string;
		let namerank: string;

		describe('authentication', () => {
			it('should use correct credentials and return the cookies for a user', async done => {
				const results = await authenticate(
					signinInformation.username,
					signinInformation.password
				);

				cookie = results;

				expect(results).toBeTruthy();

				done();
			});

			it('should throw an error with bad credentials', async done => {
				await expect(
					authenticate(signinInformation.username, 'bad password')
				).rejects.toEqual(
					new Error(
						MemberCreateError.INCORRRECT_CREDENTIALS.toString()
					)
				);
				done();
			});
		});

		describe('getting name, rank, and squadron information', () => {
			it('should return all the correct values', async done => {
				const results = await nhqGetname(cookie, '542488');

				namerank = `${results.rank} ${results.name}`;

				expect(results.nameLast).toEqual('Rioux');
				expect(results.capid).toEqual(542488);

				done();
			});

			it('should get the correct capid if the username is not numerical', async done => {
				const results = await nhqGetname(cookie, '542488');

				expect(results.capid).toEqual(542488);

				done();
			});
		});

		describe('getting capid from name and rank', () => {
			it('should get the correct capid given a rank and name', async done => {
				const { capid } = await nhqGetcapid(namerank, cookie, 'riouxad');

				expect(capid).toEqual(542488);

				done();
			});
		});

		describe('getting contact information and orgid', () => {
			it('should get contact information and the orgid', async done => {
				const results = await nhqGetcontact(cookie);

				expect(results.EMAIL.PRIMARY).toEqual(
					'arioux.cap@gmail.com'
				);

				done();
			});
		});

		describe('general requests', () => {
			it('should succeed even with a partial URL', async done => {
				const results = await nhqRequest('/preview/', cookie, false);

				expect(results.statusCode).toEqual(200);

				done();
			});
		});
	});
});
