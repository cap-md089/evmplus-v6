import * as React from 'react';
import './Konami.css';

interface KonamiProps {
	member: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
	exit: () => void;
}

interface KonamiState {
	stdout: string;
	currentCmd: string;
}

export default class Konami extends React.Component<KonamiProps, KonamiState> {
	public state: KonamiState = {
		stdout: 'Welcome to the konami console',
		currentCmd: ''
	};

	public render() {
		return (
			<div id="konami-console">
				{this.state.stdout.split('\n').map((el, i) => (
					<p key={i}>{el}</p>
				))}
			</div>
		);
	}
}
