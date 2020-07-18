import {
	AccountObject,
	Either,
	Maybe,
	MaybeObj,
	NotificationCause,
	NotificationCauseType,
	NotificationDataMessage,
	NotificationEveryoneTarget,
	NotificationObject
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
		notification: Maybe.none()
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

	private async updateNotification() {
		const notificationEither = await fetchApi.notifications.global.get({}, {});

		if (Either.isRight(notificationEither)) {
			this.setState({
				notification: notificationEither.value
			});
		}
	}

	private onButtonClick() {
		this.setState(prev => ({
			closed: prev.notification.hasValue ? prev.notification.value.id : null
		}));
	}
}
