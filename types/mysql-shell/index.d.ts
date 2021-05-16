/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

declare global {
  interface LoadDumpOptions {
    dryRun: boolean;
    osBucketName: string;
    osNamespace: string;
    ociConfigFile: string;
    ociProfile: string;
    threads: number;
    progressFile: string;
    showProgress: boolean;
    resetProgress: boolean;
    waitDumpTimeout: number;
    ignoreExistingObjects: boolean;
    ignoreVersion: boolean;
    showMetadata: boolean;
    updateGtidSet: "off" | "append" | "replace";
    skipBinlog: boolean;
    loadIndexes: boolean;
    deferTableIndexes: "off" | "fulltext" | "all";
    analyzeTables: "off" | "on" | "histogram";
    characterSet: string;
    schema: string;
    excludeSchemas: string[];
    includeSchemas: string[];
    excludeTables: string[];
    includeTables: string[];
    loadDdl: boolean;
    loadData: boolean;
    loadUsers: boolean;
    excludeUsers: string[];
    includeUsers: string[];
    createInvisiblePKs: boolean;
  }

  interface DumpOptions {
    dryRun: boolean;
    osBucketName: string;
    osNamespace: string;
    ociConfigFile: string;
    ociProfile: string;
    threads: number;
    maxRate: string;
    showProgress: boolean;
    compression: "zstd" | "gzip" | "none";
    excludeSchemas: string[];
    excludeTables: string[];
    all: boolean;
    users: boolean;
    excludeUsers: string[];
    includeUsers: string[];
    events: boolean;
    routines: boolean;
    triggers: boolean;
    defaultCharacterSet: string;
    tzUtc: boolean;
    consistent: boolean;
    ddlOnly: boolean;
    dataOnly: boolean;
    chunking: boolean;
    bytesPerChunk: string;
    ocimds: boolean;
    compatibility: (
      | "force_innodb"
      | "skip_invalid_accounts"
      | "strip_definers"
      | "strip_restricted_grants"
      | "strip_role_admin"
      | "strip_tablespaces"
      | "ignore_missing_pks"
      | "create_invisible_pks"
    )[];
    ociParManifest: boolean;
    ociParExpireTime: string;
  }

  interface Util {
    loadDump(file: string, options?: Partial<LoadDumpOptions>): void;
    dumpInstance(outputUrl: string, options?: Partial<DumpOptions>): void;
    dumpSchemas(
      schemas: string[],
      outputUrl: string,
      options?: Partial<DumpOptions>
    ): void;
    dumpTables(
      schema: string,
      tables: string[],
      outputUrl: string,
      options?: Partial<DumpOptions>
    ): void;
  }
  const util: Util;

  interface Session {
    dropSchema(name: string): void;
    createSchema(name: string): void;
  }
  const session: Session;

  interface Sys {
    argv: string[];

    path: string[];
  }
  const sys: Sys;

  interface Schema {
    getName(): string;
  }
  const db: Schema;

  interface PathModule {
    isdir(path: string): boolean;
  }

  interface OsModule {
    path: PathModule;
  }
  const os: OsModule;

  function print(...args: any[]): void;
}

export {};
