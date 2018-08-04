declare module '@mysql/xdevapi' {
	type DataModel = number;
	type DocumentOrJSON = any | string;
	type ParserOptions = DataModel;
	type SearchConditionStr = string;

	type LockContention = {
		NONE: 0;
		SHARED_LOCK: 1;
		EXCLUSIVE_LOCK: 2;
	};

	export const LockContention: LockContention;

	interface CollectionAddOptions {
		upsert: boolean;
	}

	interface CreateCollectionOptions {
		ReuseExistingObject?: boolean;
	}

	interface FieldDefinition {
		field: string;
		type: string;
		required?: boolean;
		options?: number;
		srid?: number;
	}

	interface IndexDefinition {
		type?: string;
		fields: FieldDefinition[];
	}

	interface SocketFactory {
		createSocket: Function;
	}

	interface URI {
		host?: string;
		port?: number;
		password?: string;
		user?: string;
		auth?: string;
		socketFactory?: SocketFactory;
		ssl?: boolean;
		sslOptions?: any;
	}

	interface Warning {
		level: number;
		code: number;
		msg: string;
	}

	interface Binding {
		bind(parameter: string | any, value?: string): Binding;
	}

	interface CollectionOrdering {
		sort(...SortExprStr: string[]): CollectionOrdering;
		sort(SortExprStr: string | string[]): CollectionOrdering;
	}

	interface DatabaseObject {
		getSession(): Session;
	}

	interface Grouping {
		groupBy(...GroupByExprStr: string[]): Grouping;
		groupBy(GroupByExprStr: string | string[]): Grouping;

		having(expr: SearchConditionStr): Grouping;
	}

	interface Limiting {
		limit(count: number, offset?: number): Limiting;

		offset(value: number): Limiting;
	}

	interface Locking {
		lockExclusive(mode?: LockContention): Locking;

		lockShared(mode?: LockContention): Locking;
	}

	interface Statement {
		addArgs(args: any[]): Statement;

		getArgs(): any[];

		getNamespace(): string;

		getRawStatement(): string;

		getSession(): Session;
	}

	interface TableFiltering {
		where(criteria: string): TableFiltering;
	}

	interface TableOrdering {
		orderBy(SortExprStr: string | string[]): TableOrdering;
	}

	class Collection<T = any> implements DatabaseObject {
		public add(expr: DocumentOrJSON): CollectionAdd<T>;

		public addOrReplaceOne(id: string, data: T): Promise<Result>;

		public count(): Promise<number>;

		public createIndex(
			name: string,
			constraint: IndexDefinition
		): Promise<boolean>;

		public dropIndex(name: string): Promise<boolean>;

		public existsInDatabase(): Promise<boolean>;

		public find(expr: SearchConditionStr): CollectionFind<T>;

		public getName(): string;

		public getOne(id: string): T;

		public getSchema(): Schema;

		public inspect(): { schema: string; collection: string };

		public modify(expr: SearchConditionStr): CollectionModify<T>;

		public remove(expr: SearchConditionStr): CollectionRemove<T>;

		public removeOne(id: string): Promise<Result>;

		public replaceOne(id: string, data: T): Promise<Result>;

		public getSession(): Session;
	}

	class CollectionAdd<T> {
		public add(input: T | T[]): CollectionAdd<T>;

		public execute(): Promise<Result>;
	}

	class CollectionFind<T>
		implements Binding, CollectionOrdering, Grouping, Limiting, Locking {
		public execute(callback: (fields: T[]) => void): Promise<Result>;

		public fields(projections: string[] | string): CollectionFind<T>;

		public bind(parameter: string | any, value: string): CollectionFind<T>;

		public sort(...SortExprStr: string[]): CollectionFind<T>;
		public sort(SortExprStr: string | string[]): CollectionFind<T>;

		public groupBy(...GroupByExprStr: string[]): CollectionFind<T>;
		public groupBy(GroupByExprStr: string | string[]): CollectionFind<T>;

		public having(expr: SearchConditionStr): CollectionFind<T>;

		public limit(count: number, offset?: number): CollectionFind<T>;

		public offset(value: number): CollectionFind<T>;

		public lockExclusive(mode: LockContention): CollectionFind<T>;

		public lockShared(mode: LockContention): CollectionFind<T>;
	}

	class CollectionModify<T> implements Binding, CollectionOrdering, Limiting {
		public arrayAppend(field: string, any: any): CollectionModify<T>;

		public arrayInsert(field: string, any: any): CollectionModify<T>;

		public execute(): Promise<Result>;

		public getClassName(): string;

		public patch(properties: Partial<T>): CollectionModify<T>;

		public set(field: string, any: any): CollectionModify<T>;

		public unset(fields: string | string[]): CollectionModify<T>;

		public bind(parameter: string | any, value: string): CollectionFind<T>;

		public sort(...SortExprStr: string[]): CollectionFind<T>;
		public sort(SortExprStr: string | string[]): CollectionFind<T>;

		public limit(count: number, offset?: number): CollectionFind<T>;

		public offset(value: number): CollectionFind<T>;
	}

	class CollectionRemove<T> implements Binding, CollectionOrdering, Limiting {
		public execute(): Promise<Result>;

		public bind(parameter: string | any, value: string): CollectionFind<T>;

		public sort(...SortExprStr: string[]): CollectionFind<T>;
		public sort(SortExprStr: string | string[]): CollectionFind<T>;

		public limit(count: number, offset?: number): CollectionFind<T>;

		public offset(value: number): CollectionFind<T>;
	}

	class Result {
		public getAffectedItemsCount(): number;

		public getAffectedRowsCount(): number;

		public getAutoIncrementValue(): number;

		public getGeneratedIds(): string[];

		public getWarnings(): Promise<Warning[]>;

		public getWarningsCount(): number;
	}

	class Schema implements DatabaseObject {
		public createCollection(
			name: string,
			options: CreateCollectionOptions
		): Promise<Collection>;

		public dropCollection(name: string): Promise<boolean>;

		public existsInDatabase(): Promise<boolean>;

		public getClassName(): string;

		public getCollection(name: string): Collection;

		public getCollectionAsTable(name: string): Table;

		public getCollections(): Promise<Collection[]>;

		public getName(): string;

		public getTable(name: string): Table;

		public getTables(): Promise<Table[]>;

		public inspect(): { name: string };

		public getSession(): Session;
	}

	class Session {
		/**
		 * Constructor for a X Plugin Session
		 * @param opts
		 */
		public constructor(opts?: URI);

		/**
		 * Close the server connection
		 */
		public close(): Promise<void>;

		/**
		 * Commit a transaction
		 *
		 * This will commit a transaction on the server. On success, the returned Promise will resolve to true, else the Promise will be rejected with an Error
		 */
		public commit(): Promise<boolean>;

		/**
		 * Connect to the database
		 *
		 * @returns {Promise.<Session>} Promise resolving to myself
		 */
		public connect(): Promise<Session>;

		/**
		 * Create a schema in the database
		 *
		 * @param schema Name of the schema
		 */
		public createSchema(schema: string): Promise<Schema>;

		/**
		 * Drop a schema (without failing even if it does not exist)
		 *
		 * @param schema schema name
		 * @returns {Promise.<boolean>} - Promise resolving to true on success
		 */
		public dropSchema(schema: string): Promise<boolean>;

		/**
		 * Execute a raw SQL statement
		 *
		 * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link Session#sql|Session.sql()} instead
		 * @param sql SQL statement
		 * @param args query placeholder values
		 */
		public executeSql(sql: string, args?: any): SqlExecute;

		/**
		 * Get the default schema instance
		 *
		 * @returns {Schema} The default schema bound to this session
		 */
		public getDefaultSchema(): Schema;

		/**
		 * Get instance of Schema object for a specific database schema This will always succeed, even if the schema doesn't exist.
		 * Use Schema#existsInDatabase on the returned object to verify the schema exists.
		 *
		 * @param name Name of the schema (database)
		 */
		public getSchema(name: string): Schema;

		/**
		 * Get schemas
		 *
		 * @returns {Promise.<Array.<Schema>>} Promise resolving to a list of Schema instances
		 */
		public getSchemas(): Promise<Schema[]>;

		public inspect(depth: number): any;

		/**
		 * Release a transaction savepoint with a given name
		 *
		 * @param name savepoint name
		 */
		public releaseSavePoint(name?: string): Promise<void>;

		/**
		 * Rollback a transaction This will rollback the current transaction. On success the returned Promise will resolve to true,
		 * else the Promise will be rejected with an Error. Create a Schema in the database
		 */
		public rollback(): Promise<boolean>;

		/**
		 * Rollback to a transaction savepoint with a given name
		 *
		 * @param name savepoint name
		 */
		public rollbackTo(name?: string): Promise<void>;

		/**
		 * Create a new transaction savepoint. If a name is not provided, one will be generated using the connector-nodejs- format.
		 *
		 * @param name
		 *
		 * @returns {Promise.<string>} Promise that resolves to the name of the savepoint.
		 */
		public setSavepoint(name?: string): Promise<string>;

		/**
		 * Execute a raw SQL statement.
		 *
		 * @param sql SQL statement
		 */
		public sql(sql: string): SqlExecute;

		public startTransaction(): Promise<boolean>;
	}

	class SqlExecute implements Statement {
		public bind(values: string | string[]): SqlExecute;

		public execute(
			rowcb: (items: any[]) => void,
			metacb?: (metadata: any[]) => void
		): Promise<void>;

		public addArgs(args: any[]): Statement;

		public getArgs(): any[];

		public getNamespace(): string;

		public getRawStatement(): string;

		public getSession(): Session;
	}

	class Table<T = any> {
		public delete(expr: SearchConditionStr): TableDelete<T>;

		public exiistsInDatabase(): Promise<boolean>;

		public getName(): string;

		public getSchema(): Schema;

		public insert(fields: string | string[] | T): TableInsert<T>;

		public inspect(): { schema: string; table: string };

		public isView(): Promise<boolean>;

		public select(expr: string | string[]): TableSelect<T>;

		public update(expr: string): TableUpdate<T>;
	}

	class TableDelete<T> implements Binding, Limiting, TableOrdering {
		public execute(): Promise<Result>;

		public bind(parameter: string | any, value?: string): TableDelete<T>;

		public limit(count: number, offset?: number): TableDelete<T>;

		public offset(value: number): TableDelete<T>;

		public orderBy(SortExprStr: string | string[]): TableDelete<T>;
	}

	class TableInsert<T> {
		public execute(): Promise<Result>;

		public values(ExprOrLiteral: string | string[]): TableInsert<T>;
	}

	class TableSelect<T>
		implements Binding, Grouping, Limiting, Locking, TableOrdering {
		public execute(
			rowcb: (items: any[]) => void,
			metacb: (metadata: any[]) => void
		): Promise<Result>;

		public getViewDefinition(): string;

		public bind(parameter: string | any, value: string): CollectionFind<T>;

		public sort(...SortExprStr: string[]): CollectionFind<T>;
		public sort(SortExprStr: string | string[]): CollectionFind<T>;

		public groupBy(...GroupByExprStr: string[]): CollectionFind<T>;
		public groupBy(GroupByExprStr: string | string[]): CollectionFind<T>;

		public having(expr: SearchConditionStr): CollectionFind<T>;

		public limit(count: number, offset?: number): CollectionFind<T>;

		public offset(value: number): CollectionFind<T>;

		public lockExclusive(mode: LockContention): CollectionFind<T>;

		public lockShared(mode: LockContention): CollectionFind<T>;

		public orderBy(SortExprStr: string | string[]): TableDelete<T>;
	}

	class TableUpdate<T> implements Binding, Limiting, TableOrdering {
		public execute(): Promise<Result>;

		public getClassName(): string;

		public set(field: string, expr: string): TableUpdate<T>;

		public bind(parameter: string | any, value: string): CollectionFind<T>;

		public limit(count: number, offset?: number): CollectionFind<T>;

		public offset(value: number): CollectionFind<T>;

		public orderBy(SortExprStr: string | string[]): TableDelete<T>;
	}

	/**
	 * Load a new or existing session
	 *
	 * @param properties {string | URI} session properties
	 * @returns {Promise<Session>} The session
	 */
	const getSession: (options: string | URI) => Promise<Session>;

	/**
	 * Retrieve the connector version number (from package.json)
	 *
	 * @returns {string}
	 */
	const getVersion: () => string;
}
