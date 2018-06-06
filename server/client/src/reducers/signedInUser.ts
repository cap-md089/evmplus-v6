import { UserActions, UserAction } from '../actions/userActions';
import { MemberObject } from '../../../src/types';

export default (
	state: { 
		valid: boolean,
		member?: MemberObject,
		sessionID?: string
	} = {
		valid: false
	},
	action: UserAction) => {
	switch (action.type) {
		case UserActions.SIGNOUT :
			return {
				valid: false
			};

		case UserActions.SIGNIN :
			return {
				member: action.member,
				sessionID: action.sessionID,
				error: action.error,
				valid: true
			};

		default:
			return state;
	}
};