import * as React from 'react';
import { connect } from 'react-redux';
import Dialogue from './Dialogue';

class SigninLink extends React.Component<{
	valid: boolean,
	error: string
}, {
	open: boolean,
	error: string
}> {
	state = {
		open: false,
		error: ''
	};

	private iframeRef = React.createRef<HTMLIFrameElement>();

	constructor (props: {
		valid: boolean,
		error: string
	}) {
		super(props);

		this.openDialogue = this.openDialogue.bind(this);
		this.closeDialogue = this.closeDialogue.bind(this);
	}

	componentDidUpdate (
		props: {valid: boolean, error: string},
		state: {open: boolean, error: string}
	) {
		// check if new user is valid, if so update state to close dialogue
		if (state.open && props.valid) {
			this.setState({
				open: false
			});
		} else if (state.open && (props.error !== '' && typeof props.error !== 'undefined')) {
			this.setState({
				error: props.error
			});
		}

	}

	render() {
		return (
			<>
				<a
					href="#"
					onClick={this.openDialogue}
				>
					{this.props.children}
				</a>
				<Dialogue
					title={'Sign in'}
					displayButton={this.state.error !== ''}
					buttonText={this.state.error}
					open={this.state.open}
					onClose={this.closeDialogue}
				>
					<div
						style={{
							width: 614
						}}
					>
						Enter your eServices login information below to sign into the site.
						Your password is not permanently stored. By providing your eServices information
						you agree to the terms and conditions located at&nbsp;
						<a
							href="https://www.capunit.com/eula"
							target="_blank"
						>
							https://www.capunit.com/eula
						</a>
						<br />
						<br />
						<iframe
							ref={this.iframeRef}
							sandbox="allow-scripts allow-forms allow-same-origin"
							src="/api/signin"
							style={{
								width: '100%',
								height: 140,
								padding: 0,
								margin: 0,
								border: 'none'
							}}
						/>
					</div>
				</Dialogue>
			</>
		);
	}

	private openDialogue (e: React.MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();
		this.setState({
			open: true
		});
	}

	private closeDialogue () {
		this.setState({
			open: false
		});
	}
}

export default connect(
	(state: {
		SignedInUser: {
			valid: boolean,
			error: string
		}
	}) => ({
		...state.SignedInUser
	}),
)(SigninLink);