import { EventObject, MemberReference, PointOfContactType } from '../typings/types';
import { areMembersTheSame } from './Member';

export const isPOCOf = (member: MemberReference, event: EventObject) =>
	event.pointsOfContact
		.map(
			poc =>
				poc.type === PointOfContactType.INTERNAL &&
				areMembersTheSame(member, poc.memberReference)
		)
		.reduce((prev, curr) => prev || curr, false) ||
	areMembersTheSame(member, event.author) ||
	(member.type === 'CAPNHQMember' && (member.id === 546319 || member.id === 542488));
