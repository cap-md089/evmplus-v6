import { NotificationCauseType, NotificationDataType } from 'common-lib/index';
import { DateTime } from 'luxon';
import * as React from 'react';
import Loader from '../../../components/Loader';
import Account from '../../../lib/Account';
import MemberBase from '../../../lib/Members';
import Notification from '../../../lib/Notification';
import Page, { PageProps } from '../../Page';
import './Notifications.css';
import { NotificationDataEvent, MemberAccessLevel, NotificationDataPermissions } from 'common-lib';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';

interface NotificationsState {
	notifications: Array<Notification> | null;
	currentViewed: number | null;
}

interface NotificationRenderer {
	render: (notification: Notification, member: MemberBase, account: Account) => React.ReactChild;
	shouldRender: (notification: Notification) => boolean;
}

const memberAccessLevelNumber = (l: MemberAccessLevel) =>
	['Member', 'Staff', 'Manager', 'Admin'].indexOf(l);

const renderers: NotificationRenderer[] = [
	{
		shouldRender: notif => notif.extraData === null,
		render: notif => <div>{notif.text}</div>
	},
	{
		shouldRender: notif =>
			notif.extraData !== null && notif.extraData.type === NotificationDataType.EVENT,
		render: notif => (
			<div>
				{(notif.extraData as NotificationDataEvent).delta === 'ADDED' ? (
					<div>
						You are now a Point of Contact for of the event{' '}
						<Link
							to={`/eventviewer/${
								(notif.extraData as NotificationDataEvent).eventID
							}`}
						>
							{(notif.extraData as NotificationDataEvent).eventName}
						</Link>
						.
						<br />
						<br />
						This was done by {notif.fromMemberName} on{' '}
						{DateTime.fromMillis(notif.created).toLocaleString({
							...DateTime.DATETIME_SHORT,
							hour12: false
						})}
					</div>
				) : (
					<div>
						You are no longer a Point of Contact for the event{' '}
						<Link
							to={`/eventviewer/${
								(notif.extraData as NotificationDataEvent).eventID
							}`}
						>
							{(notif.extraData as NotificationDataEvent).eventName}
						</Link>
						.
						<br />
						<br />
						This was done by {notif.fromMemberName} on{' '}
						{DateTime.fromMillis(notif.created).toLocaleString({
							...DateTime.DATETIME_SHORT,
							hour12: false
						})}
					</div>
				)}
			</div>
		)
	},
	{
		shouldRender: notif =>
			notif.extraData !== null &&
			notif.extraData.type === NotificationDataType.PERMISSIONCHANGE,
		render: notif => {
			const extraData = notif.extraData as NotificationDataPermissions;

			return (
				<div>
					You've been
					{memberAccessLevelNumber(extraData.newLevel) >
					memberAccessLevelNumber(extraData.oldLevel)
						? ' promoted '
						: ' demoted '}
					to {extraData.newLevel}, from {extraData.oldLevel}.
					<br />
					<br />
					This was done by {notif.fromMemberName} on{' '}
					{DateTime.fromMillis(notif.created).toLocaleString({
						...DateTime.DATETIME_SHORT,
						hour12: false
					})}
				</div>
			);
		}
	}
];

export default class Notifications extends Page<PageProps, NotificationsState> {
	public state: NotificationsState = {
		notifications: null,
		currentViewed: null
	};

	public constructor(props: PageProps) {
		super(props);

		this.markUnread = this.markUnread.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		const notifications = await Notification.GetList(this.props.account, this.props.member);

		notifications.reverse();

		this.setState({
			notifications
		});
	}

	public componentDidUpdate() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/admin',
				text: 'Administration'
			},
			{
				target: '/admin/notifications',
				text: 'Notifications'
			}
		]);

		if (!this.state.notifications) {
			return;
		}

		this.props.updateSideNav(
			this.state.notifications
				.filter(notif => !notif.read)
				.map(notif => ({
					type: 'Reference' as 'Reference',
					text: notif.text,
					target: `notification-${notif.id}`
				}))
		);
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in to view your notifications</div>;
		}

		if (this.state.notifications === null) {
			return <Loader />;
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
									<td>{notif.read ? notif.text : <b>{notif.text}</b>}</td>
									<td>
										{notif.cause.type === NotificationCauseType.SYSTEM
											? 'SYSTEM'
											: notif.fromMemberName}
									</td>
									<td>
										{DateTime.fromMillis(notif.created).toLocaleString({
											...DateTime.DATETIME_SHORT,
											hour12: false
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
		return (async () => {
			if (!this.state.notifications) {
				this.setState(prev => ({
					currentViewed: prev.currentViewed === index ? null : index
				}));

				return;
			}

			if (this.state.notifications[index].read) {
				this.setState(prev => ({
					currentViewed: prev.currentViewed === index ? null : index
				}));

				return;
			}

			await this.state.notifications[index].toggleRead(this.props.member!);

			this.setState(prev => ({
				currentViewed: prev.currentViewed === index ? null : index
			}));

			this.forceUpdate();
		});
	}

	private async markUnread(index: number) {
		if (!this.state.notifications) {
			return;
		}

		await this.state.notifications[index].toggleRead(this.props.member!);

		this.setState({
			currentViewed: null
		});
	}

	private renderNotification(notif: Notification) {
		for (const i of renderers) {
			if (i.shouldRender(notif)) {
				return i.render(notif, this.props.member!, this.props.account);
			}
		}

		return null;
	}
}
