#!/usr/bin/bash

mysql-shell-8.0.22-linux-glibc2.12-x86-64bit/bin/mysqlsh --password=$(cat /run/secrets/db_password) --user=$(cat /run/secrets/db_user) --host=$DB_HOST --schema=$DB_SCHEMA
