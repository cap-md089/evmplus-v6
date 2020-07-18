import { APIEither } from '../../typings/api';
import { Errors, ErrorType, NewClientErrorObject } from '../../typings/types';

export interface ClientError {
	(params: {}, body: NewClientErrorObject): APIEither<void>;

	url: '/api/errors/clienterror';

	method: 'post';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetErrors {
	(params: {}, body: {}): APIEither<Errors[]>;

	url: '/api/errors';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

interface MarkErrorDoneRequestBody {
	message: string;
	type: ErrorType;
	fileName: string;
	line: number;
	column: number;
}

export interface MarkErrorAsDone {
	(params: {}, body: MarkErrorDoneRequestBody): APIEither<void>;

	url: '/api/errors';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
