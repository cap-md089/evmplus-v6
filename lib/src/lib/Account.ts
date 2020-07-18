import {
	AccountObject,
	AccountType,
	CAPAccountObject,
	RawCAPSquadronAccountObject,
	RegularCAPAccountObject,
} from '../typings/types';
import { Maybe, MaybeObj } from './Maybe';

export const isRegularCAPAccountObject = (
	account: AccountObject
): account is RegularCAPAccountObject =>
	account.type === AccountType.CAPGROUP ||
	account.type === AccountType.CAPREGION ||
	account.type === AccountType.CAPSQUADRON ||
	account.type === AccountType.CAPWING;

export const getORGIDFromAccount = (account: RegularCAPAccountObject) =>
	account.type === AccountType.CAPSQUADRON ? account.mainOrg : account.orgid;

export const renderAccountID = (account: RawCAPSquadronAccountObject) =>
	`${account.id.replace(/([a-zA-Z]{3})([a-zA-Z]{2})([0-9]*)/, '$1-$2-$3').toUpperCase()}`;

export const getEmbedLink = (account: AccountObject) =>
	`<iframe src=\"https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
		account.mainCalendarID
	)}&ctz=America%2FNew_York\" style=\"border: 0\" width=\"720\" height=\"540\" frameborder=\"0\" scrolling=\"no\"></iframe>`;

export const getORGIDsFromCAPAccount = (account: CAPAccountObject): MaybeObj<number[]> =>
	account.type === AccountType.CAPSQUADRON
		? Maybe.some([account.mainOrg, ...account.orgIDs])
		: account.type === AccountType.CAPGROUP || account.type === AccountType.CAPREGION
		? Maybe.some([account.orgid])
		: account.type === AccountType.CAPWING
		? Maybe.some([account.orgid, ...account.orgIDs])
		: Maybe.none();
