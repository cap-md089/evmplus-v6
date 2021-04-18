import { Backends, combineBackends, withBackends } from '../backends';

interface Backend1 {
	test1: () => number;
}

interface Backend2 {
	test2: () => number;
}

describe('backends', () => {
	const backendGenerator1 = (): Backend1 => ({
		test1: () => 0,
	});
	const backendGenerator2 = (req: any, prevBackend: Backend1): Backend2 => ({
		test2: () => prevBackend.test1() + 2,
	});

	const endpoint = (backend: Backends<[Backend1, Backend2]>) => (req: number) =>
		backend.test2() + req;

	it('should use combine backend generators', () => {
		expect(
			combineBackends<number, [Backend1, Backend2]>(
				backendGenerator1,
				backendGenerator2,
			)(0).test2(),
		).toEqual(2);
	});

	it('should fail to compile if the backend generators are in the wrong order', () => {
		// @ts-expect-error
		combineBackends<number, [Backend1, Backend2]>(backendGenerator2, backendGenerator1);
	});

	it('should apply backends to a request handler', () => {
		const endpointWithBackends = withBackends(
			endpoint as any,
			combineBackends<number, [Backend1, Backend2]>(
				backendGenerator1,
				backendGenerator2,
			) as any,
		);

		expect(endpointWithBackends(3)).toEqual(5);
	});
});
