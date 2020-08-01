/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

declare module "@mysql/xdevapi" {
  export type UndefinedToNull<T> = {
    [P in keyof T]: T[P] extends undefined ? null : T[P];
  };

  export type WithoutEmpty<T> = {
    [P in keyof T]: T[P] extends null | undefined ? undefined : T[P];
  };

  export type Bound<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ? U : T[P];
  };

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
    type?: "INDEX" | "SPATIAL";
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

  interface Binding<T> {
    bind(parameter: Bound<T>): Binding<T>;
    bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): Binding<T>;
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
    public add(expr: T): CollectionAdd<T>;

    public addOrReplaceOne(id: string, data: T): Promise<Result>;

    public count(): Promise<number>;

    public createIndex(
      name: string,
      constraint: IndexDefinition
    ): Promise<boolean>;

    public dropIndex(name: string): Promise<boolean>;

    public existsInDatabase(): Promise<boolean>;

    public find(expr: SearchConditionStr): CollectionFind<T & { _id: string }>;

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
    implements Binding<T>, CollectionOrdering, Grouping, Limiting, Locking {
    public execute(
      callback: (fields: WithoutEmpty<T>) => void
    ): Promise<Result>;

    public fields(projections: string[] | string): CollectionFind<T>;

    public bind(parameter: Bound<T>): CollectionFind<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): CollectionFind<T>;

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

  class CollectionModify<T>
    implements Binding<T>, CollectionOrdering, Limiting {
    public arrayAppend<K extends keyof T = keyof T>(
      field: K,
      any: T[K] extends Array<infer U> ? U : never
    ): CollectionModify<T>;

    public arrayInsert<K extends keyof T = keyof T>(
      field: K,
      any: T[K] extends Array<infer U> ? U : never
    ): CollectionModify<T>;

    public execute(): Promise<Result>;

    public getClassName(): string;

    public patch(properties: Partial<T>): CollectionModify<T>;

    public set<K extends keyof T = keyof T>(
      field: K,
      any: T[K]
    ): CollectionModify<T>;

    public unset(fields: string | string[]): CollectionModify<T>;

    public bind(parameter: Bound<T>): CollectionModify<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): CollectionModify<T>;

    public sort(...SortExprStr: string[]): CollectionModify<T>;
    public sort(SortExprStr: string | string[]): CollectionModify<T>;

    public limit(count: number, offset?: number): CollectionModify<T>;

    public offset(value: number): CollectionModify<T>;
  }

  class CollectionRemove<T>
    implements Binding<T>, CollectionOrdering, Limiting {
    public execute(): Promise<Result>;

    public bind(parameter: Bound<T>): CollectionRemove<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): CollectionRemove<T>;

    public sort(...SortExprStr: string[]): CollectionRemove<T>;
    public sort(SortExprStr: string | string[]): CollectionRemove<T>;

    public limit(count: number, offset?: number): CollectionRemove<T>;

    public offset(value: number): CollectionRemove<T>;
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
      options?: CreateCollectionOptions
    ): Promise<Collection>;

    public dropCollection(name: string): Promise<boolean>;

    public existsInDatabase(): Promise<boolean>;

    public getClassName(): string;

    public getCollection<T = any>(name: string): Collection<WithoutEmpty<T>>;

    public getCollectionAsTable<T = any>(
      name: string
    ): Table<UndefinedToNull<T>>;

    public getCollections(): Promise<Collection[]>;

    public getName(): string;

    public getTable<T = any>(name: string): Table<UndefinedToNull<T>>;

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
      rowcb: (items: any) => void,
      metacb?: (metadata: any) => void
    ): Promise<void>;

    public addArgs(args: any[]): Statement;

    public getArgs(): any[];

    public getNamespace(): string;

    public getRawStatement(): string;

    public getSession(): Session;
  }

  class Table<T = any> {
    /**
     * Retrieve the total number of rows in the table
     *
     * @deprecated since version 8.0.12. Will be removed in future versions
     */
    public count(): Promise<number>;

    public delete(): TableDelete<T>;

    public exiistsInDatabase(): Promise<boolean>;

    public getName(): string;

    public getSchema(): Schema;

    public insert(...fields: Array<keyof T>): TableInsert<T>;
    public insert(fields: keyof T | Array<keyof T> | T): TableInsert<T>;

    public inspect(): { schema: string; table: string };

    public isView(): Promise<boolean>;

    public select(expr?: string | string[]): TableSelect<T>;

    public update(expr?: string): TableUpdate<T>;
  }

  class TableDelete<T> implements Binding<T>, Limiting, TableOrdering {
    public execute(): Promise<Result>;

    public bind(parameter: Bound<T>): TableDelete<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): TableDelete<T>;

    public limit(count: number, offset?: number): TableDelete<T>;

    public offset(value: number): TableDelete<T>;

    public orderBy(SortExprStr: string | string[]): TableDelete<T>;

    public where(expr: string): TableDelete<T>;
  }

  class TableInsert<T> {
    public execute(): Promise<Result>;

    public values(...ExprOrLiteral: any[]): TableInsert<T>;
    public values(ExprOrLiteral: string | string[]): TableInsert<T>;
  }

  class TableSelect<T>
    implements
      Binding<T>,
      Grouping,
      Limiting,
      Locking,
      TableFiltering,
      TableOrdering {
    public execute(
      rowcb?: (item: T) => void,
      metacb?: (metadata: any) => void
    ): Promise<Result>;

    public getViewDefinition(): string;

    public bind(parameter: Bound<T>): TableSelect<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): TableSelect<T>;

    public sort(...SortExprStr: string[]): TableSelect<T>;
    public sort(SortExprStr: string | string[]): TableSelect<T>;

    public groupBy(...GroupByExprStr: string[]): TableSelect<T>;
    public groupBy(GroupByExprStr: string | string[]): TableSelect<T>;

    public having(expr: SearchConditionStr): TableSelect<T>;

    public limit(count: number, offset?: number): TableSelect<T>;

    public offset(value: number): TableSelect<T>;

    public lockExclusive(mode: LockContention): TableSelect<T>;

    public lockShared(mode: LockContention): TableSelect<T>;

    public orderBy(SortExprStr: string | string[]): TableSelect<T>;

    public where(criteria: string): TableSelect<T>;
  }

  class TableUpdate<T> implements Binding<T>, Limiting, TableOrdering {
    public execute(): Promise<Result>;

    public getClassName(): string;

    public set(field: string, expr: string): TableUpdate<T>;

    public bind(parameter: Bound<T>): TableUpdate<T>;
    public bind<K extends keyof T = keyof T>(
      parameter: K,
      value: T[K] extends Array<infer U> ? U : T[K]
    ): TableUpdate<T>;

    public limit(count: number, offset?: number): TableUpdate<T>;

    public offset(value: number): TableUpdate<T>;

    public orderBy(SortExprStr: string | string[]): TableUpdate<T>;
  }

  /**
   * Load a new or existing session
   *
   * @param properties {string | URI} session properties
   * @returns {Promise<Session>} The session
   */
  const getSession: (options: string | URI) => Promise<Session>;

  class Client {
    public close(): Promise<void>;

    public getSession(): Promise<Session>;
  }

  const getClient: (options: any, options2: any) => Promise<Client>;

  /**
   * Retrieve the connector version number (from package.json)
   *
   * @returns {string}
   */
  const getVersion: () => string;
}
