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

import {
	AccountObject,
	Either,
	Maybe,
	MaybeObj,
	NotificationCause,
	NotificationCauseType,
	NotificationDataMessage,
	NotificationEveryoneTarget,
	NotificationObject,
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../lib/apis';
import Button from './Button';
import './GlobalNotification.css';

interface NotificationState {
	notification: MaybeObj<
		NotificationObject<NotificationCause, NotificationEveryoneTarget, NotificationDataMessage>
	>;
	closed: number | null;
}

interface NotificationProps {
	account: AccountObject;
}

export default class GlobalNotification extends React.Component<
	NotificationProps,
	NotificationState
> {
	public state: NotificationState = {
		closed: null,
		notification: Maybe.none(),
	};

	private timer?: number;

	public constructor(props: NotificationProps) {
		super(props);

		this.updateNotification = this.updateNotification.bind(this);
		this.onButtonClick = this.onButtonClick.bind(this);
	}

	public componentDidMount(): void {
		void this.updateNotification();

		this.timer = window.setInterval(() => void this.updateNotification(), 5 * 60 * 1000);
	}

	public componentWillUnmount(): void {
		window.clearInterval(this.timer);
		this.timer = undefined;
	}

	public render(): JSX.Element | null {
		if (
			!this.state.notification.hasValue ||
			this.state.closed === this.state.notification.value.id
		) {
			return null;
		}

		return (
			<div className="banner">
				<Button
					onClick={this.onButtonClick}
					buttonType="none"
					className="floatAllthewayRight"
				>
					&#10006;
				</Button>
				{this.state.notification.value.cause.type === NotificationCauseType.MEMBER
					? `${this.state.notification.value.cause.fromName} - `
					: null}
				{this.state.notification.value.extraData.message}
			</div>
		);
	}

	private updateNotification = async (): Promise<void> => {
		const notificationEither = await fetchApi.notifications.global.get({}, {});

		if (Either.isRight(notificationEither)) {
			this.setState({
				notification: notificationEither.value,
			});
		}
	};

	private onButtonClick = (): void => {
		this.setState(prev => ({
			closed: prev.notification.hasValue ? prev.notification.value.id : null,
		}));
	};
}
