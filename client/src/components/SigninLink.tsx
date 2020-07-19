import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import Button from './Button';
import './Signin.css';

interface SigninLinkProps {
	returnUrl?: string;
	onClick?: () => void;
}

type FullSigninLinkProps = RouteComponentProps<{}> & SigninLinkProps;

class SigninLink extends React.Component<FullSigninLinkProps> {
	public get returnUrl(): string {
		return this.props.returnUrl === null || this.props.returnUrl === undefined
			? window.location.pathname
			: this.props.returnUrl;
	}

	constructor(props: FullSigninLinkProps) {
		super(props);

		this.move = this.move.bind(this);
	}

	public render() {
		return (
			<Button buttonType="none" onClick={this.move}>
				{this.props.children}
			</Button>
		);
	}

	private move(): void {
		this.props.history.push('/signin?returnurl=' + encodeURIComponent(this.returnUrl));
		this.props.onClick?.();
	}
}

export default withRouter(SigninLink);
