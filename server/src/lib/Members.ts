import { Schema } from '@mysql/xdevapi';
import { MemberReference } from 'common-lib';
import Account from './Account';

export { ConditionalMemberRequest, MemberRequest } from './member/pam/Session';

// Members
import MemberBase from './member/MemberBase';
export default MemberBase;

import CAPNHQMember, { CAPNHQUser } from './member/members/CAPNHQMember';
import CAPProspectiveMember, { CAPProspectiveUser } from './member/members/CAPProspectiveMember';

export * from './member/MemberBase';
export * from './member/members/CAPNHQMember';
export * from './member/members/CAPProspectiveMember';
export { CAPProspectiveMember, CAPNHQMember };

export type CAPMemberClasses = CAPProspectiveMember | CAPNHQMember;
export type CAPUserClasses = CAPProspectiveUser | CAPNHQUser;

export type MemberClasses = CAPMemberClasses;
export type UserClasses = CAPUserClasses;

export function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull?: false
): Promise<MemberClasses | null>;
export function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull: true
): Promise<MemberClasses>;
export async function resolveReference(
	ref: MemberReference,
	account: Account,
	schema: Schema,
	errOnNull = false
): Promise<MemberClasses | null> {
	switch (ref.type) {
		case 'Null':
			if (errOnNull) {
				throw new Error('Null member');
			}
			return Promise.resolve(null);

		case 'CAPNHQMember':
			return CAPNHQMember.Get(ref.id, account, schema);

		case 'CAPProspectiveMember':
			return CAPProspectiveMember.Get(ref.id, account, schema);
	}
}

export function isRioux(cm: MemberBase | number | string): boolean {
	if (typeof cm === 'number' || typeof cm === 'string') {
		return cm === 542488 || cm === 546319;
	}

	if (cm instanceof MemberBase) {
		return cm.isRioux;
	}

	return false;
}

export function getUserID(name: string[]): string {
	let usrID = '';

	usrID = name[2] + name[0][0] + name[1][0];

	return usrID.toLocaleLowerCase();
}

export function isValidMemberReference(value: any): value is MemberReference {
	if (typeof value !== 'object' || value === null || value === undefined) {
		return false;
	}

	if (typeof value.type === 'undefined') {
		return false;
	}

	if (value.type === 'Null') {
		return true;
	}

	if (value.type === 'CAPNHQMember' && typeof value.id === 'number') {
		return true;
	}

	if (value.type === 'CAPProspectiveMember' && typeof value.id === 'string') {
		return true;
	}

	return false;
}

export function areMemberReferencesTheSame(ref1: MemberReference, ref2: MemberReference) {
	if (ref1.type === 'Null' || ref2.type === 'Null') {
		return false;
	}

	return ref1.id === ref2.id && ref1.type === ref2.type;
}