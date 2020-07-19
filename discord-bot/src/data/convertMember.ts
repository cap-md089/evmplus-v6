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
