import { APIEither } from '../../typings/api';
import { RegistryValues } from '../../typings/types';

export interface GetRegistry {
	(params: {}, body: {}): APIEither<RegistryValues>;

	url: '/api/registry';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface SetRegistry {
	(params: {}, body: Partial<RegistryValues>): APIEither<void>;

	url: '/api/registry';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
