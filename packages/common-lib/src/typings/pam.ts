import { MemberReference, SafeUserAccountInformation } from './types';

export interface TokenObject {
	token: string;
	created: number;
	member: SafeUserAccountInformation;
}

export interface AccountCreationToken {
	member: MemberReference;
	created: number;
	token: string;
}
