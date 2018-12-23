import esp, { StackFrame } from 'error-stack-parser';
import * as React from 'react';
import MemberBase from 'src/lib/Members';
import Account from 'src/lib/Account';
import ErrorMessage from 'src/lib/ErrorMessage';

export default class ErrorHandler extends React.Component<
	{
		member: MemberBase | null;
		account: Account;
	},
	{
		crash: boolean;
	}
> {
	public state = {
		crash: false
	};

	constructor(props: {
		member: MemberBase | null;
		account: Account;
	}) {
		super(props);

		this.tryAgain = this.tryAgain.bind(this);
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// tslint:disable-next-line:no-console
		console.log('Error logged');

		const stacks = esp.parse.bind(esp)(error) as StackFrame[];

		const errorObject: NewClientErrorObject = {
			componentStack: errorInfo.componentStack,
			message: error.message,
			pageURL: location.href,
			resolved: false,
			stack: stacks.map(stack => ({
				filename: stack.getFileName(),
				line: stack.getLineNumber(),
				column: stack.getColumnNumber(),
				name: stack.getFunctionName()
			})),
			timestamp: Date.now(),
			type: 'Client'
		};

		ErrorMessage.Create(errorObject, this.props.member, this.props.account);

		this.setState({
			crash: true
		});
	}

	public render() {
		return this.state.crash ? (
			<div>
				<h1>Uh oh! Something bad happened on our end...</h1>
				The page appears to have crashed. The developers have been
				notified so that they may fix the issue. Please refresh the page
				and <a href="#" onClick={this.tryAgain}>try again</a>. {/*If you want to provide feedback, please submit feedback
				through our feedback form */}
			</div>
		) : (
			this.props.children
		);
	}

	private tryAgain() {
		this.setState({crash: false});
	}
}
