import APIInterface from './APIInterface';
import Account from './Account';

export default class Registry extends APIInterface<RegistryValues> implements RegistryValues {
	public static async Get(account: Account) {
		let result;
		try {
			result = await account.fetch(`/api/registry`);
		} catch (e) {
			throw new Error('Could not get registry');
		}

		const registry = await result.json();

		return new Registry(registry, account);
	}

	public Contact: WebsiteContact;

	public Website: WebsiteInformation;

	public constructor(values: RegistryValues, account: Account) {
		super(account.id);

		this.Contact = values.Contact;
		this.Website = values.Website;
	}

	public get id() {
		return this.accountID;
	}

	public toRaw(): RegistryValues {
		return {
			accountID: this.accountID,
			Contact: this.Contact,
			id: this.id,
			Website: this.Website
		}
	}
}