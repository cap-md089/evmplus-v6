import { Schema } from '@mysql/xdevapi';
import Account from './Account';
import { collectResults, findAndBind } from './MySQLUtil';

export default class Registry implements DatabaseInterface<RegistryValues> {
	public static async Get(
		account: Account,
		schema: Schema
	): Promise<Registry> {
		const registryCollection = schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		const results = await collectResults(
			findAndBind(registryCollection, {
				accountID: account.id
			})
		);

		if (results.length !== 1) {
			throw new Error('Cannot get the registry values for an account');
		}

		return new Registry(results[0], account, schema);
	}

	private static collectionName = 'Registry';

	public values: RegistryValues = {} as RegistryValues;

	public get accountID(): string {
		return this.account.id;
	}

	private account: Account;
	
	private schema: Schema;

	private constructor(
		values: RegistryValues,
		account: Account,
		schema: Schema
	) {
		this.set(values);

		this.account = account;
		this.schema = schema;
	}

	public set(values: Partial<RegistryValues>) {
		const keys: Array<keyof RegistryValues> = ['contact', 'website'];

		for (const i of keys) {
			if (typeof values[i] !== 'undefined') {
				this.values[i] = values[i];
			}
		}
	}

	public async save() {
		const registryCollection = this.schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		await registryCollection.replaceOne(this.values._id, this.values);
	}

	public toRaw = (): RegistryValues => ({...this.values});
}
