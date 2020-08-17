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

import esp, { StackFrame } from 'error-stack-parser';
import * as React from 'react';
import { NewClientErrorObject, ErrorResolvedStatus, User, AccountObject } from 'common-lib';
import fetchApi from '../lib/apis';

export default class ErrorHandler extends React.PureComponent<
	{
		member: User | null;
		account: AccountObject;
	},
	{
		crash: boolean;
	}
> {
	public state = {
		crash: false,
	};

	constructor(props: { member: User | null; account: AccountObject }) {
		super(props);

		this.tryAgain = this.tryAgain.bind(this);
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// tslint:disable-next-line:no-console
		console.log(error);

		const stacks = esp.parse.bind(esp)(error) as StackFrame[];

		const errorObject: NewClientErrorObject = {
			componentStack: errorInfo.componentStack,
			message: error.message,
			pageURL: window.location.href,
			resolved: ErrorResolvedStatus.UNRESOLVED,
			stack: stacks.map(stack => ({
				filename: stack.getFileName(),
				line: stack.getLineNumber(),
				column: stack.getColumnNumber(),
				name: stack.getFunctionName() || '<unknown>',
			})),
			timestamp: Date.now(),
			type: 'Client',
		};

		fetchApi.errors.clientError({}, errorObject, this.props.member?.sessionID).then(
			() => {
				// tslint:disable-next-line:no-console
				console.log('Error logged');
			},
			() => {
				// tslint:disable-next-line:no-console
				console.log('Failed to log error');
			},
		);

		this.setState({
			crash: true,
		});
	}

	public render() {
		return this.state.crash ? (
			<div>
				<h1>Uh oh! Something bad happened on our end...</h1>
				The page appears to have crashed. The developers have been notified so that they may
				fix the issue. If you want to try again,
				<button className="linkButton" onClick={this.tryAgain}>
					please refresh the page
				</button>
				.{' '}
				{/*If you want to provide feedback, please submit feedback
				through our feedback form */}
			</div>
		) : (
			this.props.children
		);
	}

	private tryAgain() {
		this.setState({ crash: false });
	}
}
