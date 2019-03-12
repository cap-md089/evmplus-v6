import * as React from 'react';
import Account from '../lib/Account';
import Notification from '../lib/Notification';
import './GlobalNotification.css';
import Button from './Button';

interface NotificationState {
	notification: null | Notification;
	closed: number | null;
}

interface NotificationProps {
	account: Account;
}

export default class GlobalNotification extends React.Component<
	NotificationProps,
	NotificationState
> {
	public state: NotificationState = {
		closed: null,
		notification: null
	};

	private timer?: number;

	public constructor(props: NotificationProps) {
		super(props);

		this.updateNotification = this.updateNotification.bind(this);
		this.onButtonClick = this.onButtonClick.bind(this);
	}

	public componentDidMount() {
		this.updateNotification();

		this.timer = window.setInterval(this.updateNotification, 5 * 60 * 1000);
	}

	public componentWillUnmount() {
		window.clearInterval(this.timer);
		this.timer = undefined;
	}

	public render() {
		if (!this.state.notification || this.state.closed === this.state.notification.id) {
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
				{this.state.notification.fromMemberName} {this.state.notification.text}
			</div>
		);
	}

	private async updateNotification() {
		const notification = await Notification.GetGlobal(this.props.account);

		this.setState({
			notification
		});
	}

	private onButtonClick() {
		this.setState(prev => ({
			closed: prev.notification ? prev.notification.id : null
		}));
	}
}
