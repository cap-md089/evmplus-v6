import { AsyncEither, ServerError } from 'common-lib';

export type ServerEither<T> = AsyncEither<ServerError, T>;
