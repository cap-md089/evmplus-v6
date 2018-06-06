import { MemberObject } from '../../../src/types';

export const UserActions: {[key: string]: UserActionType} = {
	SIGNIN: 'USER_SIGNIN',
	SIGNOUT: 'USER_SIGNOUT'
};

export type UserActionType = 'USER_SIGNIN' | 'USER_SIGNOUT';

export interface UserAction {
	type: UserActionType;
	member: MemberObject;
	sessionID: string;
	error: string;
	valid: boolean;
}

export const signOut = () => {
	return {
		type: UserActions.SIGNOUT
	};
};

export const signIn = (valid: boolean, sessionID: string, error: string, member: MemberObject): UserAction => {
	return {
		type: UserActions.SIGNIN,
		sessionID,
		error,
		member,
		valid
	};
};