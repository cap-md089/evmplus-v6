#!/bin/bash

<<LICENSE
 Copyright (C) 2021 Andrew Rioux
 
 This file is part of EvMPlus.org.
 
 EvMPlus.org is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 
 EvMPlus.org is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
LICENSE

STAGING=1

file_arg=""
if [ "$STAGING" = "1" ]; then
	file_arg="-f docker-compose.dev.yml"
fi

pushd /srv/backups/mysqldumps

PS3='Select a dump to load: '
options=($(ls))
select opt in "${options[@]}"
do
	if [[ "${options[@]}" =~ "${opt}" ]]; then
		if [[ -f "$opt" ]]; then
			sudo mkdir -p ${opt/.zip/}
			[[ ! -f "${opt/.zip/}" ]] && sudo rm -rf ${opt/.zip/}
			sudo unzip $opt -d ${opt/.zip/} 
			popd
			docker-compose $file_arg run mysqlsh --file load-dump.js /srv/backups/mysqldumps/${opt/.zip/} || exit 1
			sudo rm -rf /srv/backups/mysqldumps/${opt/.zip/}
		else
			docker-compose $file_arg run mysqlsh --file load-dump.js /srv/backups/mysqldumps/$opt
		fi
		break
	else
		echo "Please select a valid option"
	fi
done