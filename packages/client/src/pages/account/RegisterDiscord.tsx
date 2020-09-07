/**
 * Copyright (C) 2020 Andrew Rioux
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

import { Either, EitherObj, HTTPError, Maybe, MaybeObj } from 'common-lib';
import * as React from 'react';
import Loader from '../../components/Loader';
import SigninLink from '../../components/SigninLink';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface RegisterDiscordState {
	result: MaybeObj<EitherObj<HTTPError, void>>;
}

export default class RegisterDiscord extends Page<
	PageProps<{ discordid: string }>,
	RegisterDiscordState
> {
	public state: RegisterDiscordState = {
		result: Maybe.none(),
	};

	public async componentDidMount() {
		if (!this.props.member) {
			this.props.routeProps.history.push(
				`/signin/?returnurl=/registerdiscord/${this.props.routeProps.match.params.discordid}`,
			);
			return;
		}

		this.setState({
			result: Maybe.some(
				await fetchApi.member.account.registerDiscord(
					{ discordID: this.props.routeProps.match.params.discordid },
					{},
					this.props.member.sessionID,
				),
			),
		});
	}

	public render() {
		if (!this.props.member) {
			return <SigninLink>You need to sign in to view this page</SigninLink>;
		}

		if (!this.state.result.hasValue) {
			return <Loader />;
		}

		if (Either.isLeft(this.state.result.value)) {
			return <div>{this.state.result.value.value.message}</div>;
		}

		return <div>You can now close this page</div>;
	}
}
