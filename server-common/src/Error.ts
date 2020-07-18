import { ServerError, Either, MemberReference } from 'common-lib';

export const normalizeError = (message: string): ServerError => ({
	type: 'OTHER',
	code: 400,
	message,
});
export const normalizeErrorFunc = Either.leftMap<string, ServerError, MemberReference>(
	normalizeError
);
