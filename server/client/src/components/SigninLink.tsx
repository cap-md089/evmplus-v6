import * as React from 'react';
import { connect } from 'react-redux';

import { displayDialogue } from '../actions/dialogue';

class SigninLink extends React.Component<{
	displayDialogue: (
		title: string,
		text: JSX.Element,
		buttontext: string,
		displayButton: boolean
	) => void
}, {}> {
	render() {
		return (
			<a
				href="#"
				onClick={
					(e: React.MouseEvent<HTMLElement>) => {
						e.preventDefault();
						this.props.displayDialogue(
							'Sign in', 
							<iframe
								sandbox="allow-scripts allow-forms allow-same-origin"
								src="/api/signin"
								style={{
									width: '100%',
									height: '220px',
									padding: 0,
									margin: 0,
									border: 'none'
								}}
							/>,
							'Sign in',
							false
						);
					}
				}
			>
				{this.props.children}
			</a>
		);
	}
}

export default connect(
	undefined,
	(dispatch) => {
		return {
			displayDialogue: (
				title: string,
				text: JSX.Element,
				buttontext: string,
				displayButton: boolean
			) => {
				dispatch(displayDialogue(title, text, buttontext, displayButton));	
			}
		};
	}
)(SigninLink);