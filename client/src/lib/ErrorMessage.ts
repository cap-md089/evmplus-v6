import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './Members';
import {
	ErrorObject,
	NewClientErrorObject,
	ClientErrorObject,
	ServerErrorObject
} from 'common-lib';

export default class ErrorMessage extends APIInterface<ErrorObject> {
	public static async Create(
		info: NewClientErrorObject,
		member: MemberBase | null,
		account: Account
	) {
		const req = await account.fetch('/api/clienterror', {
			body: JSON.stringify(info),
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'authorization': member ? member.sessionID : ''
			}
		});

		const fullError = (await req.json()) as ClientErrorObject;

		return new ErrorMessage(fullError);
	}

	public constructor(public error: ClientErrorObject | ServerErrorObject) {
		super(error.accountID);
	}

	public toRaw(): ClientErrorObject | ServerErrorObject {
		if (this.error.type === 'Client') {
			return {
				accountID: this.error.accountID,
				componentStack: this.error.componentStack,
				id: this.error.id,
				message: this.error.message,
				pageURL: this.error.pageURL,
				resolved: this.error.resolved,
				stack: this.error.stack,
				timestamp: this.error.timestamp,
				type: 'Client',
				user: this.error.user
			};
		} else {
			return {
				accountID: this.error.accountID,
				filename: this.error.filename,
				id: this.error.id,
				message: this.error.message,
				requestMethod: this.error.requestMethod,
				requestedPath: this.error.requestedPath,
				requestedUser: this.error.requestedUser,
				resolved: this.error.resolved,
				stack: this.error.stack,
				timestamp: this.error.timestamp,
				type: 'Server',
				payload: this.error.payload
			};
		}
	}

	public async resolve(member: MemberBase) {
		if (!member.isRioux) {
			throw new Error('Cannot resolve issue unless developer');
		}
	}
}
