import BaseMember from './BaseMember';
import NHQMember, { MemberRequest } from './members/NHQMember';

BaseMember.ExpressMiddleware = NHQMember.ExpressMiddleware;

export default BaseMember;

export {
	NHQMember,
	MemberRequest
};