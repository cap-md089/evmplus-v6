import * as request from 'supertest';
import conftest from '../conf.test';
import getServer from '../getServer';

console = {
 	log: (...values: any[]): void => void 0,
	error: (...values: any[]): void => void 0
} as typeof console

describe('getServer', () => {
	it('should use loggers when told it is not testing', async done => {
		const { server } = await getServer(
			{
				...conftest,
				testing: false
			},
			3007
		);

		server.close();

		done();
	});

	it('should return an image successfully', async done => {
		const { server } = await getServer(conftest, 3007);

		request(server)
			.get('/images/banner')
			.expect(200, done);
	});
});
