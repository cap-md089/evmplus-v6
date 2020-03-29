import { CAPMemberContact, MemberReference } from '../typings/types';
import { fromValue, just, Maybe, none } from './Maybe';

export const stringifyMemberReference = (ref: MemberReference) =>
	ref.type === 'Null' ? 'Null' : `${ref.type}-${ref.id}`;

export const parseStringMemberReference = (ref: string): Maybe<MemberReference> =>
	ref === 'None'
		? just<MemberReference>({ type: 'Null' })
		: just(ref.split('-'))
				.filter(arr => arr.length === 2)
				.flatMap(([type, id]) =>
					type === 'CAPNHQMember'
						? just<MemberReference>({
								type: 'CAPNHQMember',
								id: parseInt(id, 10)
						  })
						: type === 'CAPProspectiveMember'
						? just<MemberReference>({
								type: 'CAPProspectiveMember',
								id
						  })
						: none()
				);

export const getMemberPhone = (contact: CAPMemberContact) =>
	fromValue(
		contact.CELLPHONE.PRIMARY ||
			contact.WORKPHONE.PRIMARY ||
			contact.HOMEPHONE.PRIMARY ||
			contact.CADETPARENTPHONE.PRIMARY ||
			contact.CELLPHONE.SECONDARY ||
			contact.WORKPHONE.SECONDARY ||
			contact.HOMEPHONE.SECONDARY ||
			contact.CADETPARENTPHONE.SECONDARY ||
			contact.CELLPHONE.EMERGENCY ||
			contact.WORKPHONE.EMERGENCY ||
			contact.HOMEPHONE.EMERGENCY ||
			contact.CADETPARENTPHONE.EMERGENCY
	);

export const getMemberEmail = (contact: CAPMemberContact) =>
	fromValue(
		contact.EMAIL.PRIMARY ||
			contact.CADETPARENTEMAIL.PRIMARY ||
			contact.EMAIL.SECONDARY ||
			contact.CADETPARENTEMAIL.SECONDARY ||
			contact.EMAIL.EMERGENCY ||
			contact.CADETPARENTEMAIL.EMERGENCY
	);

export const areMembersTheSame = (ref1: MemberReference, ref2: MemberReference) =>
	ref1.type !== 'Null' && ref1.type === ref2.type && ref1.id === ref2.id;
