import * as React from 'react';
import { MemberCreateError } from 'src/enums';
import { MessageEventListener } from '../App';
import Dialogue from './Dialogue';
import './Signin.css';

const errorMessages = {
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'Incorrect credentials',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session',
	[MemberCreateError.NONE]: '',
	[MemberCreateError.PASSWORD_EXPIRED]: 'eServices password has expired',
	[MemberCreateError.SERVER_ERROR]: 'Server error'
};

interface SigninLinkState {
	open: boolean;
	error: number;
}

class SigninLink extends React.Component<
	SigninReturn & {
		authorizeUser: (arg: SigninReturn) => void;
	},
	SigninLinkState
> {
	public state: SigninLinkState = {
		open: false,
		error: MemberCreateError.NONE
	};

	private key: number;
	private iframeRef: HTMLIFrameElement;

	constructor(
		props: SigninReturn & {
			authorizeUser: (arg: SigninReturn) => void;
		}
	) {
		super(props);

		this.openDialogue = this.openDialogue.bind(this);
		this.closeDialogue = this.closeDialogue.bind(this);
		this.windowEvent = this.windowEvent.bind(this);
	}

	public componentDidUpdate(
		props: SigninReturn & {
			authorizeUser: (arg: SigninReturn) => void;
		},
		state: { open: boolean; error: number }
	) {
		// check if new user is valid, if so update state to close dialogue
		if (state.open && props.valid) {
			this.setState({
				open: false
			});
			if (this.iframeRef.contentWindow) {
				this.iframeRef.contentWindow.postMessage(
					'done submitting',
					'*'
				);
			}
		} else if (
			state.open &&
			(typeof props.error !== 'undefined' &&
				props.error !== MemberCreateError.NONE) &&
			// Check if things actually changed, as otherwise it's an infinite loop
			props.error !== state.error
		) {
			this.setState({
				error: props.error
			});
			if (this.iframeRef.contentWindow) {
				this.iframeRef.contentWindow.postMessage(
					'done submitting',
					'*'
				);
			}
		}
	}

	public componentDidMount() {
		this.key = MessageEventListener.subscribe(this.windowEvent);
	}

	public componentWillUnmount() {
		MessageEventListener.unsubscribe(this.key);
	}

	public render() {
		return (
			<>
				<a href="#" onClick={this.openDialogue}>
					{this.props.children}
				</a>
				<Dialogue
					title={'Sign in'}
					displayButton={false}
					open={this.state.open}
					onClose={this.closeDialogue}
				>
					<div
						style={{
							width: 614
						}}
					>
						Enter your eServices login information below to sign
						into the site. Your password is not permanently stored.
						By providing your eServices information you agree to the
						terms and conditions located at&nbsp;
						<a href="https://www.capunit.com/eula" target="_blank">
							https://www.capunit.com/eula
						</a>
						<div className="signin-error">
							{this.state.error !== MemberCreateError.NONE
								? errorMessages[this.state.error]
								: null}
						</div>
						<br />
						<br />
						<iframe
							src="/api/signin"
							style={{
								width: '100%',
								height: 140,
								padding: 0,
								margin: 0,
								border: 'none'
							}}
							ref={el => {
								this.iframeRef = el as HTMLIFrameElement;
							}}
						/>
					</div>
				</Dialogue>
			</>
		);
	}

	private openDialogue(e: React.MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();
		this.setState({
			open: true
		});
	}

	private closeDialogue() {
		this.setState({
			open: false
		});
	}

	private windowEvent(e: MessageEvent) {
		try {
			const data = JSON.parse(e.data) as SigninReturn;
			if (
				typeof data.error !== 'undefined' &&
				typeof data.valid !== 'undefined' &&
				data.valid === true &&
				typeof data.sessionID !== 'undefined' &&
				typeof data.member !== 'undefined'
			) {
				localStorage.setItem('sessionID', data.sessionID);
				this.props.authorizeUser({
					valid: data.valid,
					error: data.error,
					member: data.member,
					sessionID: data.sessionID
				});
			}
		} catch (e) {
			// ignore
		}
	}
}

export default SigninLink;
