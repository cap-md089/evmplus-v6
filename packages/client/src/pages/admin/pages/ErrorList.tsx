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
	always,
	api,
	APIEndpointReturnValue,
	areErrorObjectsTheSame,
	ClientErrorObject,
	complement,
	DiscordBotErrorObject,
	Either,
	Errors,
	ErrorType,
	get,
	HTTPError,
	isRioux,
	Maybe,
	MaybeObj,
	ServerErrorObject,
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import DropDownList from '../../../components/DropDownList';
import Loader from '../../../components/Loader';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import { RequiredMember } from '../pluggables/SiteAdmin';

export const shouldRenderErrorList = (props: PageProps): boolean =>
	!!props.member && isRioux(props.member);

interface ErrorListWidgetState {
	errors: MaybeObj<APIEndpointReturnValue<api.errors.GetErrors>>;
}

export class ErrorListWidget extends Page<RequiredMember, ErrorListWidgetState> {
	public state: ErrorListWidgetState = {
		errors: Maybe.none(),
	};

	public async componentDidMount() {
		if (!shouldRenderErrorList(this.props)) {
			throw new Error('What??');
		}

		const errors = Maybe.some(
			await fetchApi.errors.getErrors({}, {}, this.props.member.sessionID),
		);

		this.setState({ errors });
	}

	public render() {
		return (
			<div className="widget">
				<Link to="/admin/errorlist">
					<div className="widget-title">Errors</div>
				</Link>
				<div className="widget-body">
					{Maybe.cata<APIEndpointReturnValue<api.errors.GetErrors>, React.ReactChild>(
						always(<LoaderShort />),
					)(
						Either.cata<HTTPError, Errors[], React.ReactChild>(err => (
							<div>{err.message}</div>
						))(errors => (
							<div>
								There {errors.length === 1 ? 'is' : 'are'} {errors.length} error
								{errors.length === 1 ? '' : 's'}.
								<br />
								<br />
								<Link to="/admin/errorlist">
									Check {errors.length === 1 ? 'it' : 'them'} out
								</Link>
							</div>
						)),
					)}
				</div>
			</div>
		);
	}
}

const titleStyle = {
	borderBottom: '1px solid #2b357b',
};

interface ErrorListPageState {
	errors: MaybeObj<APIEndpointReturnValue<api.errors.GetErrors>>;
}

export default class ErrorListPage extends Page<PageProps, ErrorListPageState> {
	public state: ErrorListPageState = {
		errors: Maybe.none(),
	};

	public constructor(props: PageProps) {
		super(props);

		this.resolveError = this.resolveError.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member || !shouldRenderErrorList(this.props)) {
			throw new Error('What??');
		}

		const errors = Maybe.some(
			await fetchApi.errors.getErrors({}, {}, this.props.member.sessionID),
		);

		this.setState({ errors });

		this.updateSideNav(errors);
	}

	public render() {
		if (!this.props.member || !shouldRenderErrorList(this.props)) {
			return <div>You do not have permission to view this page</div>;
		}

		if (Maybe.isNone(this.state.errors)) {
			return <Loader />;
		}

		if (Either.isLeft(this.state.errors.value)) {
			return <div>{this.state.errors.value.value.message}</div>;
		}

		return (
			<>
				{this.renderErrorList(this.state.errors.value.value, 'Client')}
				{this.renderErrorList(this.state.errors.value.value, 'Server')}
				{this.renderErrorList(this.state.errors.value.value, 'DiscordBot')}
			</>
		);
	}

	private renderErrorList(errors: Errors[], type: ErrorType) {
		const title =
			type === 'Client' ? (
				<h1 id="client-errors">Client errors</h1>
			) : type === 'DiscordBot' ? (
				<h1 id="discord-errors">Discord Bot Errors</h1>
			) : (
				<h1 id="server-errors">Server errors</h1>
			);

		errors = errors.filter(error => error.type === type);

		const errorTable: Errors[][] = [];

		for (const error of errors) {
			const comparer = areErrorObjectsTheSame(error);
			let found = false;
			for (const errorRow of errorTable) {
				if (comparer(errorRow[0])) {
					errorRow.push(error);
					found = true;
					break;
				}
			}
			if (!found) {
				errorTable.push([error]);
			}
		}

		return errors.length > 0 ? (
			<>
				{title}

				{errorTable.map((errorList, i) => (
					<div key={i}>
						{type === 'Server'
							? this.renderServerErrorObject(errorList as ServerErrorObject[])
							: type === 'DiscordBot'
							? this.renderDiscordBotErrorObject(errorList as DiscordBotErrorObject[])
							: this.renderClientErrorObject(errorList as ClientErrorObject[])}
					</div>
				))}
			</>
		) : null;
	}

	// These two render functions expect an array of Errors that are all similar.
	// That is, they all have the same message, line, column, file, and type
	// However, they can differ in HTTP paths or members

	private renderServerErrorObject(errorInfo: ServerErrorObject[]) {
		const id = errorInfo[0].id;

		return (
			<div>
				<h2 className="title" style={titleStyle}>
					Issue #{id} (Occurred {errorInfo.length} times)
					<Button<Errors>
						useData={true}
						data={errorInfo[0]}
						className="rightFloat"
						buttonType="none"
						onClick={this.resolveError}
					>
						Issue resolved?
					</Button>
				</h2>
				<p>
					First appearance: {new Date(errorInfo[0].timestamp).toString()}
					<br />
					Error: {errorInfo[0].message}
					<br />
					Where: {errorInfo[0].stack[0].filename}:{errorInfo[0].stack[0].line}:
					{errorInfo[0].stack[0].column}
					<br />
					Function: {errorInfo[0].stack[0].name}
					<DropDownList<ServerErrorObject>
						titles={error =>
							`${error.requestMethod} ${error.requestedPath} (${JSON.stringify(
								error.requestedUser,
							)})`
						}
						onlyOneOpen={true}
						values={errorInfo}
					>
						{(error, i) => (
							<div key={i}>
								<h3>Payload</h3>
								<pre>{error.payload}</pre>
								<h3>Stack</h3>
								<ul>
									{error.stack.map((err, ind) => (
										<li key={ind}>
											<p>
												File: {err.filename}:{err.line}:{err.column}
												<br />
												Function: {err.name}
											</p>
										</li>
									))}
								</ul>
							</div>
						)}
					</DropDownList>
				</p>
			</div>
		);
	}

	private renderDiscordBotErrorObject(errorInfo: DiscordBotErrorObject[]) {
		const id = errorInfo[0].id;

		return (
			<div>
				<h2 className="title" style={titleStyle}>
					Issue #{id} (Occurred {errorInfo.length} times)
					<Button<Errors>
						useData={true}
						data={errorInfo[0]}
						className="rightFloat"
						buttonType="none"
						onClick={this.resolveError}
					>
						Issue resolved?
					</Button>
				</h2>
				<p>
					First appearance: {new Date(errorInfo[0].timestamp).toString()}
					<br />
					Error: {errorInfo[0].message}
					<br />
					Where: {errorInfo[0].stack[0].filename}:{errorInfo[0].stack[0].line}:
					{errorInfo[0].stack[0].column}
					<br />
					Function: {errorInfo[0].stack[0].name}
					<DropDownList<DiscordBotErrorObject>
						titles={error => `(${error.message})`}
						onlyOneOpen={true}
						values={errorInfo}
					>
						{(error, i) => (
							<div key={i}>
								<h3>Stack</h3>
								<ul>
									{error.stack.map((err, ind) => (
										<li key={ind}>
											<p>
												File: {err.filename}:{err.line}:{err.column}
												<br />
												Function: {err.name}
											</p>
										</li>
									))}
								</ul>
							</div>
						)}
					</DropDownList>
				</p>
			</div>
		);
	}

	private renderClientErrorObject(errorInfo: ClientErrorObject[]) {
		const id = errorInfo[0].id;

		return (
			<div>
				<h2 className="title" style={titleStyle}>
					Issue #{id} (Occurred {errorInfo.length} times)
					<Button<Errors>
						useData={true}
						data={errorInfo[0]}
						className="rightFloat"
						buttonType="none"
						onClick={this.resolveError}
					>
						Issue resolved?
					</Button>
				</h2>
				<p>
					First appearance: {new Date(errorInfo[0].timestamp).toString()}
					<br />
					Error: {errorInfo[0].message}
					<br />
					Where: {errorInfo[0].stack[0].filename}:{errorInfo[0].stack[0].line}:
					{errorInfo[0].stack[0].column}
					<br />
					Function: {errorInfo[0].stack[0].name}
					<DropDownList<ClientErrorObject>
						titles={error => `(${JSON.stringify(error.user)})`}
						onlyOneOpen={true}
						values={errorInfo}
					>
						{(error, i) => (
							<div key={i}>
								<h3>Page url</h3>
								<pre>{error.pageURL}</pre>
								<h3>Stack</h3>
								<ul>
									{error.stack.map((err, ind) => (
										<li key={ind}>
											<p>
												File: {err.filename}:{err.line}:{err.column}
												<br />
												Function: {err.name}
											</p>
										</li>
									))}
								</ul>
							</div>
						)}
					</DropDownList>
				</p>
			</div>
		);
	}

	private async resolveError(error: Errors) {
		if (!this.props.member || !shouldRenderErrorList(this.props)) {
			throw new Error('No!');
		}

		await fetchApi.errors.markErrorDone(
			{},
			{
				column: error.stack[0].column,
				fileName: error.stack[0].filename,
				line: error.stack[0].line,
				message: error.message,
				type: error.type,
			},
			this.props.member.sessionID,
		);

		const comparer = areErrorObjectsTheSame(error);

		this.setState(
			errors => ({
				errors: Maybe.map<
					APIEndpointReturnValue<api.errors.GetErrors>,
					APIEndpointReturnValue<api.errors.GetErrors>
				>(Either.map(items => items.filter(complement(comparer))))(errors.errors),
			}),
			() => {
				this.updateSideNav(this.state.errors);
			},
		);
	}

	private updateSideNav(errors: MaybeObj<APIEndpointReturnValue<api.errors.GetErrors>>) {
		if (Maybe.isNone(errors) || Either.isLeft(errors.value)) {
			this.props.updateSideNav([]);
		} else {
			const errorList = errors.value.value;

			const hasClientError = errorList.some(error => error.type === 'Client');
			const hasServerError = errorList.some(error => error.type === 'Server');
			const hasDiscordError = errorList.some(error => error.type === 'DiscordBot');

			this.props.updateSideNav(
				[
					hasClientError
						? Maybe.some({
								target: 'client-errors',
								text: 'Client Errors',
								type: 'Reference' as const,
						  })
						: Maybe.none(),
					hasServerError
						? Maybe.some({
								target: 'server-errors',
								text: 'Server Errors',
								type: 'Reference' as const,
						  })
						: Maybe.none(),
					hasDiscordError
						? Maybe.some({
								target: 'discord-errors',
								text: 'Discord Bot Errors',
								type: 'Reference' as const,
						  })
						: Maybe.none(),
				]
					.filter(Maybe.isSome)
					.map(get('value')),
			);
		}
	}
}
