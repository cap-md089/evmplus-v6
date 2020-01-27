import { MemberReference } from "../typings/types";

export const stringifyMemberReference = (ref: MemberReference) => 
	ref.type === 'Null'
		? 'Null'
		: `${ref.type}-${ref.id}`