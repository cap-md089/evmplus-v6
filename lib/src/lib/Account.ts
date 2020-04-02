import { RawAccountObject } from '../typings/types';

export const renderAccountID = (account: RawAccountObject) => {
	return `MAR-${account.id.slice(0, 2).toUpperCase()}-${account.id.slice(2)}`;
};
