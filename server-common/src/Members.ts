import type { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AsyncEither,
	asyncLeft,
	MemberForReference,
	MemberReference,
	ServerError,
} from 'common-lib';
import { getCAPMemberName, resolveCAPReference } from './member/members/cap';

export * from './member/members';

export const resolveReference = (schema: Schema) => (account: AccountObject) => <
	T extends MemberReference = MemberReference
>(
	ref: T
): AsyncEither<ServerError, MemberForReference<T>> =>
	ref.type === 'CAPNHQMember' || ref.type === 'CAPProspectiveMember'
		? resolveCAPReference(schema)(account)<T>(ref)
		: asyncLeft({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });

export const getMemberName = (schema: Schema) => (account: AccountObject) => (
	ref: MemberReference
): AsyncEither<ServerError, string> =>
	ref.type === 'CAPProspectiveMember' || ref.type === 'CAPNHQMember'
		? getCAPMemberName(schema)(account)(ref)
		: asyncLeft({
				type: 'OTHER',
				message: 'Invalid member type',
				code: 400,
		  });
