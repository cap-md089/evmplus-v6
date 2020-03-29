import { AccountObject } from '../typings/types';

export const renderAccountID = (account: AccountObject) => {
	return `MAR-${account.id.slice(0, 2).toUpperCase()}-${account.id.slice(2)}`;
};
