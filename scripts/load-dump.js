/**
 * Copyright (C) 2021 Andrew Rioux
 * 
 * This file is part of Event Manager and acts as a utility script to load
 * a specific MySQL dump
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
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