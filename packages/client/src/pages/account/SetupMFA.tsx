/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
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

import { Either, HTTPError, Left, Maybe, MaybeObj } from 'common-lib';
import { toDataURL } from 'qrcode';
import React from 'react';
import SimpleForm, { Label, TextInput } from '../../components/forms/SimpleForm';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface SetupMFALoadingState {
	state: 'LOADING';
}

interface SetupMFALoadedState {
	state: 'LOADED';

	otpauthUrlQRCode: string;
}

interface SetupMFAErrorState {
	state: 'ERROR';

	message: string;
}

interface SetupMFAUIState {
	inputCode: string;
	verificationResult: MaybeObj<Left<HTTPError>>;
}

type SetupMFAState = SetupMFAUIState &
	(SetupMFALoadingState | SetupMFALoadedState | SetupMFAErrorState);

export default class SetupMFA extends Page<PageProps, SetupMFAState> {
	public state: SetupMFAState = {
		state: 'LOADING',
		inputCode: '',
		verificationResult: Maybe.none(),
	};

	public constructor(props: PageProps) {
		super(props);

		this.checkToken = this.checkToken.bind(this);
	}

	public async componentDidMount(): Promise<void> {
		if (!this.props.member) {
			return;
		}

		const otpauthUrlResult = await fetchApi.member.session.startMFASetup({}, {});

		if (Either.isLeft(otpauthUrlResult)) {
			return this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: otpauthUrlResult.value.message,
			}));
		}

		const otpauthUrlQRCode = await toDataURL(otpauthUrlResult.value);

		this.setState(prev => ({
			...prev,

			state: 'LOADED',
			otpauthUrlQRCode,
		}));
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		return (
			<>
				<div>
					To set up Multi Factor Authentication, scan the image below in your One-Time
					Password Authentication app, and then input the code provided.
					<br />
					<br />
					{Maybe.isSome(this.state.verificationResult) ? (
						<div>{this.state.verificationResult.value.value.message}</div>
					) : null}
					<br />
					<br />
					<img src={this.state.otpauthUrlQRCode} alt="OTPA QR code" />
					<br />
					<br />
					<SimpleForm<{ inputCode: string }>
						onChange={({ inputCode }) => this.setState({ inputCode })}
						values={this.state}
						onSubmit={this.checkToken}
					>
						<Label>Input code</Label>
						<TextInput name="inputCode" />
					</SimpleForm>
				</div>
			</>
		);
	}

	private checkToken = async ({ inputCode }: { inputCode: string }): Promise<void> => {
		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.member.session.finishMFASetup({}, { mfaToken: inputCode });

		if (Either.isLeft(result)) {
			this.setState({
				inputCode: '',
				verificationResult: Maybe.some(result),
			});
		} else {
			this.props.routeProps.history.push('/admin');
		}
	};
}
