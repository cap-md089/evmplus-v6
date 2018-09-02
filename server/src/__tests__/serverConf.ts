import * as request from 'supertest';
import conftest from '../conf.test';
import getServer from '../getServer';
/*
console = {
 	log: (...values: any[]): void => void 0,
	error: (...values: any[]): void => void 0
} as typeof console
*/
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

	it('should throw an error on collision', async done => {
		process.exit = jest.fn() as any as (code?: number) => never;

		await getServer(conftest, 3007);
		await getServer(conftest, 3008);

		expect(process.exit).toHaveBeenCalled();

		done();
	});

	it('should throw an error with a lack of permissions', async done => {

		process.exit = jest.fn() as any as (code?: number) => never;

		await getServer(conftest, 80);

		expect(process.exit).toHaveBeenCalled();

		done();
	});

	it('should return an image successfully', async done => {
		const { server } = await getServer(conftest, 3007);

		request(server)
			.get('/images/banner')
			.expect(200, done);
	});
});
