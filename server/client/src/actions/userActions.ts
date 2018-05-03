import { MemberObject } from '../../../src/types';

export enum UserActions {
	SIGNIN,
	SIGNOUT
}

export interface UserAction {
	type: UserActions;
	member: MemberObject;
	sessionID: string;
}

export const signOut = () => {
	return {
		type: UserActions.SIGNOUT
	};
};

export const signIn = (links: {
	text: string,
	target: string,
}[]) => {
	return {
		type: UserActions.SIGNIN,
		links: links
	};
};