import * as React from 'react';
import Page, { PageProps } from '../Page';
import { Either, api, Maybe, none, just } from 'common-lib';
import Loader from '../../components/Loader';

interface RegisterDiscordState {
	result: Maybe<Either<api.HTTPError, void>>;
}

export default class RegisterDiscord extends Page<
	PageProps<{ discordid: string }>,
	RegisterDiscordState
> {
	public state: RegisterDiscordState = {
		result: none()
	};

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		this.setState({
			result: just(
				await this.props.member.registerDiscord(
					this.props.routeProps.match.params.discordid
				)
			)
		});
	}

	public render() {
		if (!this.props.member) {
			// this.props.routeProps.history.push('/signin/?returnurl=' + )
			return <div>You need to sign in to view this page</div>;
		}

		if (!this.state.result.hasValue) {
			return <Loader />;
		}

		return this.state.result.value.cata(
			err => <div>{err.message}</div>,
			() => <div>You can now close this page</div>
		);
	}
}
