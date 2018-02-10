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
						let path = true ? 'http://localhost:3001/api/signin' : '/api/signin';
						e.preventDefault();
						this.props.displayDialogue(
							'Sign in', 
							<iframe src={path} />,
							'Sign in',
							false
						);
					}
				}
			>
				{
					React.Children.map(this.props.children, a => a)
				}
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