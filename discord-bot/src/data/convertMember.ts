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

import { Schema } from '@mysql/xdevapi';
import { AccountObject, asyncRight, Either, errorGenerator, get, Maybe } from 'common-lib';
import { GuildMember } from 'discord.js';
import { resolveReference } from 'server-common';
import getMember from './getMember';

export const toCAPUnit = (schema: Schema) => (account: AccountObject) => (
	guildMember: GuildMember
) =>
	asyncRight(getMember(schema)(guildMember), errorGenerator('Could not get member information'))
		.map(Maybe.map(get('member')))
		.map(Maybe.map(resolveReference(schema)(account)))
		.flatMap((member) =>
			member.hasValue ? member.value.map(Maybe.some) : Either.right(Maybe.none())
		);
