#!/bin/bash

<<LICENSE
 Copyright (C) 2020 Andrew Rioux
 
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

/usr/local/mysql-shell/bin/mysqlsh -h mysql --password=$(cat /run/secrets/mysql_root_password) --user=root --file /usr/evm-plus/cronjobs/database-dump.js

printf -v date "%(%Y_%m_%d)T"

pushd /srv/backups/mysqldumps

zip -r mysql-dump-$date.zip mysql-dump-$date
rm -rf mysql-dump-$date

popd
