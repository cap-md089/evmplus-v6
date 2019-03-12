import { NotificationCauseType } from 'common-lib/index';
import { DateTime } from 'luxon';
import * as React from 'react';
import Loader from '../../../components/Loader';
import Account from '../../../lib/Account';
import MemberBase from '../../../lib/Members';
import Notification from '../../../lib/Notification';
import Page, { PageProps } from '../../Page';
import './Notifications.css';

interface NotificationsState {
	notifications: Array<Notification> | null;
	currentViewed: number | null;
}

interface NotificationRenderer {
	render: (notification: Notification, member: MemberBase, account: Account) => React.ReactChild;
	shouldRender: (notification: Notification) => boolean;
}

const renderers: NotificationRenderer[] = [
	{
		shouldRender: notif => notif.extraData === null,
		render: notif => <div>{notif.text}</div>
	}
];

export default class Notifications extends Page<PageProps, NotificationsState> {
	public state: NotificationsState = {
		notifications: null,
		currentViewed: null
	};

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		const notifications = await Notification.GetList(this.props.account, this.props.member);

		this.setState({
			notifications
		});

		this.props.updateSideNav(
			notifications.map(notif => ({
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
										<td colSpan={3}>{this.renderNotification(notif)}</td>
									</tr>
								) : null}
							</React.Fragment>
						))}
					</tbody>
				</table>
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

			await this.state.notifications[index].markRead(this.props.member!);

			this.setState(prev => ({
				currentViewed: prev.currentViewed === index ? null : index
			}));

			this.forceUpdate();
		}).bind(this);
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
