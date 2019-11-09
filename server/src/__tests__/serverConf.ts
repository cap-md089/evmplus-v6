import conftest from '../conf.test';
import getServer from '../getServer';

const exit = jest.spyOn(process, 'exit').mockImplementation((num: number) => num);
const error = jest.spyOn(console, 'error').mockImplementation((num: number) => num);

describe('getServer', () => {
	it('should create a server', async done => {
		const serverPromise = getServer(conftest, 3007);

		const { server } = await serverPromise;

		expect(server.address().port).toEqual(3007);

		server.close();

		done();
	});

	it('should throw an error if the port is in use', async done => {
		const { server: server1 } = await getServer(conftest, 3007);

		try {
			await getServer(conftest, 3007);
		} catch (e) {
			// nothing
		}

		server1.close();

		expect(exit).toHaveBeenCalled();
		expect(error).toHaveBeenCalled();

		done();
	});
});
