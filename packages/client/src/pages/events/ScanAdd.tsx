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

import { Maybe, MaybeObj, Either, EitherObj, AttendanceStatus } from 'common-lib';
import * as React from 'react';
import Page, { PageProps } from '../Page';
import fetchApi from '../../lib/apis';
import Loader from '../../components/Loader';
import SimpleForm, { Label, NumberInput } from '../../components/forms/SimpleForm';

interface ScanAddLoadingState {
	state: 'LOADING';
}

interface ScanAddLoadedState {
	state: 'LOADED';
}

interface ScanAddErrorState {
	state: 'ERROR';

	error: string;
}

interface ScanAddUIState {
	message: MaybeObj<EitherObj<string, string>>;
	capid: number | null;
}

type ScanAddState = ScanAddUIState & (ScanAddLoadedState | ScanAddLoadingState | ScanAddErrorState);

export default class ScanAdd extends Page<PageProps<{ id: string }>, ScanAddState> {
	public state: ScanAddState = {
		message: Maybe.none(),
		capid: null,
		state: 'LOADING',
	};

	private inputRef = React.createRef<HTMLInputElement>();

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		const result = await fetchApi.member.session.setScanAdd(
			{},
			{ eventID: parseInt(this.props.routeProps.match.params.id, 10) },
			this.props.member.sessionID,
		);

		if (Either.isLeft(result) && result.value.code !== 403) {
			this.setState(prev => ({
				...prev,

				state: 'ERROR',
				error: result.value.message,
			}));
		} else {
			this.setState(prev => ({
				...prev,

				state: 'LOADED',
			}));
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>You need to sign in to view this page</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.error}</div>;
		}

		return (
			<>
				{Maybe.isSome(this.state.message) ? (
					<div className="banner">{this.state.message.value.value}</div>
				) : null}
				<SimpleForm<{ capid: number | null }>
					validator={{
						capid: id => id !== null && id > 100000 && id <= 999999,
					}}
					values={this.state}
					onChange={({ capid }) => this.setState({ capid })}
					onSubmit={this.onSubmit}
				>
					<Label>Scan your CAP ID</Label>

					<NumberInput
						ref={this.inputRef}
						name="capid"
						errorMessage="Number must be a valid CAP ID"
					/>
				</SimpleForm>
			</>
		);
	}

	private async onSubmit({ capid }: { capid: number | null }) {
		if (!capid || !this.props.member) {
			return;
		}

		const result = await fetchApi.events.attendance.add(
			{ id: this.props.routeProps.match.params.id },
			{
				comments: '',
				customAttendanceFieldValues: [],
				planToUseCAPTransportation: false,
				status: AttendanceStatus.COMMITTEDATTENDED,
				memberID: {
					id: capid,
					type: 'CAPNHQMember',
				},
			},
			this.props.member.sessionID,
		);

		if (Either.isLeft(result)) {
			this.setState({
				message: Maybe.some(Either.left('Failed to add member to attendance')),
				capid: null,
			});
		} else {
			this.setState({
				message: Maybe.some(
					Either.right('Successfully added ' + result.value.memberName + ' to event.'),
				),
				capid: null,
			});
		}

		this.inputRef.current?.focus();

		setTimeout(() => {
			this.setState({
				message: Maybe.none(),
			});
		}, 5000);
	}
}
