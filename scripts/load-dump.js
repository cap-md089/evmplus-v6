/**
 * Copyright (C) 2021 Andrew Rioux
 * 
 * This file is part of EvMPlus.org and acts as a utility script to load
 * a specific MySQL dump
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

/// <reference path="../types/mysql-shell/index.d.ts" />

var dumpName = sys.argv[1];

if (dumpName === undefined) {
	print('Dump path not provided')
} else {
	if (os.path.isdir(dumpName)) {
		var schemaName = db.getName();
		session.dropSchema(schemaName);
		session.createSchema(schemaName);
		util.loadDump(dumpName);
	} else {
		print('Dump path not valid')
	}
}