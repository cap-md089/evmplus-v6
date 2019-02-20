import * as React from 'react';
import { MessageEventListener } from '../App';
import { MemberCreateError } from 'common-lib/index';
import Dialogue, { DialogueButtons } from './dialogues/Dialogue';
import './Signin.css';
import { SigninReturn } from 'common-lib';

const errorMessages = {
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'Incorrect credentials',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session',
	[MemberCreateError.NONE]: '',
	[MemberCreateError.PASSWORD_EXPIRED]: 'eServices password has expired',
	[MemberCreateError.SERVER_ERROR]: 'Server error'
};

interface SigninLinkState {
	open: boolean;
	error: MemberCreateError;
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

	private key: number | null= null;
	private iframeRef: HTMLIFrameElement | null = null;

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
		state: SigninLinkState
	) {
		// check if new user is valid, if so update state to close dialogue
		if (state.open && state.error !== MemberCreateError.NONE) {
			this.setState({
				open: false,
				error: MemberCreateError.NONE
			});
			if (this.iframeRef!.contentWindow) {
				this.iframeRef!.contentWindow.postMessage(
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
		MessageEventListener.unsubscribe(this.key!);
	}

	public render() {
		return (
			<>
				<a href="#" onClick={this.openDialogue}>
					{this.props.children}
				</a>
				<Dialogue
					title={'Sign in'}
					displayButtons={DialogueButtons.NONE}
					open={this.state.open}
					onClose={this.closeDialogue}
				>
					<div
						style={{
							maxWidth: 614
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
								? errorMessages[this.state.error as keyof typeof errorMessages]
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
				typeof data.error === 'number' &&
				typeof data.valid === 'boolean' &&
				typeof data.sessionID === 'string' &&
				// typeof null === 'object'
				typeof data.member === 'object' &&
				this.state.open
			) {
				if (data.valid && data.member !== null) {
					localStorage.setItem('sessionID', data.sessionID);
					this.setState(
						{
							error: MemberCreateError.NONE,
							open: false
						},
						() => {
							this.props.authorizeUser({
								valid: data.valid,
								error: data.error,
								member: data.member,
								sessionID: data.sessionID,
								notificationCount: 0
							});
						}
					);
				} else {
					this.setState({
						error: data.error
					});
				}
			}
		} catch (e) {
			// ignore
		}
	}
}

export default SigninLink;
