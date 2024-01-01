#!/bin/bash

<<LICENSE
 Copyright (C) 2021 Andrew Rioux
 
 This file is part of Event Manager.
 
 Event Manager is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 
 Event Manager is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
LICENSE

cd ..

STAGING="1"

file_arg=""
if [ "$STAGING" = "1" ]; then
	file_arg="-f docker-compose.dev.yml"
fi

docker-compose $file_arg exec mysql sh -c \
	"exec mysqldump --databases EventManagementv6 --no-data --user=root --password=$(cat keys/mysql_root_password)" > /tmp/00-setup-tables.sql
tail -n+2 /tmp/00-setup-tables.sql | dos2unix > mysql-init/00-setup-tables.sql
rm /tmp/00-setup-tables.sql

echo "Done."