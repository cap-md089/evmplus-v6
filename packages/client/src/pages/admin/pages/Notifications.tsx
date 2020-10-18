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
	Member,
	NotificationCause,
	NotificationCauseType,
	NotificationData,
	NotificationDataEvent,
	NotificationDataMessage,
	NotificationDataPermissions,
	NotificationDataType,
	NotificationObject,
	NotificationTarget,
	Either,
	get,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import Loader from '../../../components/Loader';
import Page, { PageProps } from '../../Page';
import './Notifications.css';
import fetchApi from '../../../lib/apis';

interface NotificationRenderer<T extends NotificationData = NotificationData> {
	render: (
		notification: NotificationObject<NotificationCause, NotificationTarget, T>,
		member: Member,
		account: AccountObject,
	) => React.ReactChild;
	shouldRender: (
		notification: NotificationObject<NotificationCause, NotificationTarget, any>,
	) => notification is NotificationObject<NotificationCause, NotificationTarget, T>;
}

type NO<T extends NotificationData> = NotificationObject<NotificationCause, NotificationTarget, T>;

const renderers: [
	NotificationRenderer<NotificationDataMessage>,
	NotificationRenderer<NotificationDataEvent>,
	NotificationRenderer<NotificationDataPermissions>,
] = [
	{
		shouldRender: (notif): notif is NO<NotificationDataMessage> => notif.extraData === null,
		render: notif => <div>{notif.extraData.message}</div>,
	},
	{
		shouldRender: (notif): notif is NO<NotificationDataEvent> =>
			notif.extraData.type === NotificationDataType.EVENT,
		render: notif => (
			<div>
				{notif.extraData.delta === 'ADDED' ? (
					<div>
						You are now a Point of Contact for of the event{' '}
						<Link to={`/eventviewer/${notif.extraData.eventID}`}>
							{notif.extraData.eventName}
						</Link>
						.
						<br />
						<br />
						This was done by{' '}
						{notif.cause.type === NotificationCauseType.MEMBER
							? notif.cause.fromName
							: 'SYSTEM'}{' '}
						on{' '}
						{DateTime.fromMillis(notif.created).toLocaleString({
							...DateTime.DATETIME_SHORT,
							hour12: false,
						})}
					</div>
				) : (
					<div>
						You are no longer a Point of Contact for the event{' '}
						<Link to={`/eventviewer/${notif.extraData.eventID}`}>
							{notif.extraData.eventName}
						</Link>
						.
						<br />
						<br />
						This was done by{' '}
						{notif.cause.type === NotificationCauseType.MEMBER
							? notif.cause.fromName
							: 'SYSTEM'}{' '}
						on{' '}
						{DateTime.fromMillis(notif.created).toLocaleString({
							...DateTime.DATETIME_SHORT,
							hour12: false,
						})}
					</div>
				)}
			</div>
		),
	},
	{
		shouldRender: (notif): notif is NO<NotificationDataPermissions> =>
			notif.extraData.type === NotificationDataType.PERMISSIONCHANGE,
		render: notif => {
			return (
				<div>
					Your permission levels have changed
					<br />
					<br />
					This was done by{' '}
					{notif.cause.type === NotificationCauseType.MEMBER
						? notif.cause.fromName
						: 'SYSTEM'}{' '}
					on{' '}
					{DateTime.fromMillis(notif.created).toLocaleString({
						...DateTime.DATETIME_SHORT,
						hour12: false,
					})}
				</div>
			);
		},
	},
];

interface NotificationsLoadingState {
	state: 'LOADING';
}

interface NotificationsLoadedState {
	state: 'LOADED';

	notifications: NotificationObject[];
}

interface NotificationsErrorState {
	state: 'ERROR';

	message: string;
}

interface NotificationsUIState {
	currentViewed: number | null;
}

type NotificationsState = (
	| NotificationsLoadedState
	| NotificationsLoadingState
	| NotificationsErrorState
) &
	NotificationsUIState;

const simpleText = (notif: NotificationObject) =>
	notif.extraData.type === NotificationDataType.EVENT
		? `Event "${notif.extraData.eventName}" notification`
		: notif.extraData.type === NotificationDataType.MESSAGE
		? notif.extraData.message
		: notif.extraData.type === NotificationDataType.PERMISSIONCHANGE
		? `Permission change`
		: notif.extraData.type === NotificationDataType.PERSONNELFILES
		? 'Personnel file update'
		: 'Prospective member information update';

export default class Notifications extends Page<PageProps, NotificationsState> {
	public state: NotificationsState = {
		state: 'LOADING',
		currentViewed: null,
	};

	public constructor(props: PageProps) {
		super(props);

		this.markUnread = this.markUnread.bind(this);
	}

	public async componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/notifications',
				text: 'Notifications',
			},
		]);

		if (!this.props.member) {
			return;
		}

		const notificationsEither = await fetchApi.notifications.list({}, {});

		if (Either.isLeft(notificationsEither)) {
			return this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: notificationsEither.value.message,
			}));
		}

		const notifications = notificationsEither.value.filter(Either.isRight).map(get('value'));

		notifications.reverse();

		this.setState({
			currentViewed: null,
			state: 'LOADED',
			notifications,
		});
	}

	public componentDidUpdate() {
		if (this.state.state !== 'LOADED') {
			return;
		}

		this.props.updateSideNav(
			this.state.notifications
				.filter(notif => !notif.read)
				.map(notif => ({
					type: 'Reference' as const,
					text: simpleText(notif),
					target: `notification-${notif.id}`,
				})),
		);
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in to view your notifications</div>;
		}

		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		return (
			<div>
				<table id="notification-list">
					<tbody>
						<tr>
							<th>Notification name</th>
							<th>From</th>
							<th>Sent</th>
						</tr>
						{this.state.notifications.map((notif, i) => (
							<React.Fragment key={i}>
								<tr
									className="notification"
									id={`notification-${notif.id}`}
									onClick={this.notificationClick(i)}
								>
									<td>
										{notif.read ? (
											simpleText(notif)
										) : (
											<b>{simpleText(notif)}</b>
										)}
									</td>
									<td>
										{notif.cause.type === NotificationCauseType.SYSTEM
											? 'SYSTEM'
											: notif.cause.fromName}
									</td>
									<td>
										{DateTime.fromMillis(notif.created).toLocaleString({
											...DateTime.DATETIME_SHORT,
											hour12: false,
										})}
									</td>
								</tr>
								{i === this.state.currentViewed ? (
									<tr className="current-notification-view">
										<td colSpan={3}>
											<span className="current-notification-actions">
												<Button<number>
													useData={true}
													data={i}
													onClick={this.markUnread}
													buttonType="none"
												>
													Mark unread
												</Button>
											</span>
											<div className="current-notification-text">
												{this.renderNotification(notif)}
											</div>
										</td>
									</tr>
								) : null}
							</React.Fragment>
						))}
					</tbody>
				</table>
				{this.state.notifications.length === 0 ? <h3>No notifications</h3> : null}
			</div>
		);
	}

	private notificationClick(index: number) {
		return async () => {
			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			this.setState(prev => ({
				currentViewed: prev.currentViewed === index ? null : index,
			}));

			const notification = this.state.notifications[index];

			if (!notification) {
				return;
			}

			if (notification.read) {
				this.setState(prev => ({
					currentViewed: prev.currentViewed === index ? null : index,
				}));

				return;
			}

			await fetchApi.notifications.toggleRead({ id: index.toString() }, {});

			this.setState(prev => ({
				currentViewed: prev.currentViewed === index ? null : index,
			}));
		};
	}

	private async markUnread(index: number) {
		if (!this.props.member || this.state.state !== 'LOADED') {
			return;
		}

		const notification = this.state.notifications[index];

		if (!notification) {
			return;
		}

		await fetchApi.notifications.toggleRead({ id: index.toString() }, {});

		this.setState({
			currentViewed: null,
		});
	}

	private renderNotification(notif: NotificationObject) {
		for (const i of renderers) {
			if (i.shouldRender(notif)) {
				return i.render(
					notif as NotificationObject<NotificationCause, NotificationTarget, any>,
					this.props.member!,
					this.props.account,
				);
			}
		}

		return null;
	}
}
