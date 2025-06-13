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

	public render = (): JSX.Element => (
		<Button buttonType="none" onClick={this.move}>
			{this.props.children}
		</Button>
	);

	private move = (): void => {
		this.props.history.push('/signin?returnurl=' + encodeURIComponent(this.returnUrl));
		this.props.onClick?.();
	};
}

export default withRouter(SigninLink);
