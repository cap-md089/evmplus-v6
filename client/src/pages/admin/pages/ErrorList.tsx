import {
	api,
	areErrorObjectsTheSame,
	ClientErrorObject,
	Either,
	either,
	Errors,
	ErrorType,
	isSomething,
	just,
	Maybe,
	none,
	ServerErrorObject
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import DropDownList from '../../../components/DropDownList';
import Loader from '../../../components/Loader';
import LoaderShort from '../../../components/LoaderShort';
import { SideNavigationItem } from '../../../components/page-elements/SideNavigation';
import Page, { PageProps } from '../../Page';
import { RequiredMember } from '../pluggables/SiteAdmin';
import { fetchFunction } from '../../../lib/myFetch';
import APIInterface from '../../../lib/APIInterface';

export const shouldRenderErrorList = (props: PageProps): boolean => !!props.member?.isRioux;

interface ErrorListWidgetState {
	errors: Maybe<Either<api.HTTPError, Errors[]>>;
}

export class ErrorListWidget extends Page<RequiredMember, ErrorListWidgetState> {
	public state: ErrorListWidgetState = {
		errors: none()
	};

	public async componentDidMount() {
		if (!this.props.member.isRioux) {
			throw new Error('What??');
		}

		const resp = await this.props.account.fetch(`/api/errors`, {}, this.props.member);
		const errors = just(either((await resp.json()) as api.errors.GetErrors));

		this.setState({ errors });
	}

	public render() {
		return (
			<div className="widget">
				<Link to="/admin/errorlist">
					<div className="widget-title">Errors</div>
				</Link>
				<div className="widget-body">
					{this.state.errors.cata(
						() => (
							<LoaderShort />
						),
						errorsEither =>
							errorsEither.cata(
								err => <div>{err.message}</div>,
								errors => (
									<div>
										There {errors.length === 1 ? 'is' : 'are'} {errors.length}{' '}
										error
										{errors.length === 1 ? '' : 's'}.
										<br />
										<br />
										<Link to="/admin/errorlist">
											Check {errors.length === 1 ? 'it' : 'them'} out
										</Link>
									</div>
								)
							)
					)}
				</div>
			</div>
		);
	}
}

const titleStyle = {
	borderBottom: '1px solid #2b357b'
};

interface ErrorListPageState {
	errors: Maybe<Either<api.HTTPError, Errors[]>>;
}

export default class ErrorListPage extends Page<PageProps, ErrorListPageState> {
	public state: ErrorListPageState = {
		errors: none()
	};

	public constructor(props: PageProps) {
		super(props);

		this.resolveError = this.resolveError.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member?.isRioux) {
			throw new Error('What??');
		}

		const resp = await this.props.account.fetch(`/api/errors`, {}, this.props.member);
		const errors = just(either((await resp.json()) as api.errors.GetErrors));

		this.setState({ errors });

		this.updateSideNav(errors);
	}

	public render() {
		if (!this.props.member?.isRioux) {
			return <div>You do not have permission to view this page</div>;
		}

		return this.state.errors.cata(
			() => <Loader />,
			errorEither =>
				errorEither.cata(
					error => <div>{error.message}</div>,
					errors => (
						<>
							{this.renderErrorList(errors, 'Client')}
							{this.renderErrorList(errors, 'Server')}
						</>
					)
				)
		);
	}

	private renderErrorList(errors: Errors[], type: ErrorType) {
		const title =
			type === 'Client' ? (
				<h1 id="client-errors">Client errors</h1>
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
								error.requestedUser
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
		if (!this.props.member?.isRioux) {
			throw new Error('No!');
		}

		const token = await APIInterface.getToken(this.props.account.id, this.props.member);

		const result = await this.props.member.memberFetch(
			`/api/errors`,
			{
				body: JSON.stringify({
					column: error.stack[0].column,
					line: error.stack[0].line,
					fileName: error.stack[0].filename,
					type: error.type,
					message: error.message,
					token
				})
			},
			fetchFunction
		);

		const returnValue = either((await result.json()) as api.errors.MarkErrorAsDone);
		const comparer = areErrorObjectsTheSame(error);

		this.setState(
			errors => ({
				errors: errors.errors.map(eith =>
					eith.map(items => items.filter(item => !comparer(item)))
				)
			}),
			() => {
				this.updateSideNav(this.state.errors);
			}
		);
	}

	private updateSideNav(errors: Maybe<Either<api.HTTPError, Errors[]>>) {
		this.props.updateSideNav(
			errors
				.map(list =>
					list
						.map(errorList => {
							const serverErrors = errorList.filter(error => error.type === 'Server');
							const clientErrors = errorList.filter(error => error.type === 'Client');
							return [
								clientErrors.length > 0
									? just<SideNavigationItem>({
											target: 'client-errors',
											text: 'Client Errors',
											type: 'Reference'
									  })
									: none<SideNavigationItem>(),
								serverErrors.length > 0
									? just<SideNavigationItem>({
											target: 'server-errors',
											text: 'Server Errors',
											type: 'Reference'
									  })
									: none<SideNavigationItem>()
							]
								.filter(isSomething)
								.map(item => item.some());
						})
						.toSome()
						.orSome([])
				)
				.orSome([])
		);
	}
}
