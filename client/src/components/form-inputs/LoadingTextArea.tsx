import * as React from 'react';
import Loader from '../Loader';
import { TextAreaProps } from './TextArea';

interface LoadingTextAreaState {
	textArea: typeof import('./TextArea') | null;
}

export default class LoadingTextArea extends React.Component<TextAreaProps, LoadingTextAreaState> {
	public state: LoadingTextAreaState = {
		textArea: null
	};

	public componentDidMount() {
		import('./TextArea').then(textArea => {
			this.setState({
				textArea
			});
		});
	}

	public render() {
		if (!this.props.account) {
			throw new Error('Account not specified');
		}

		if (typeof this.props.member === 'undefined') {
			throw new Error(
				'No member variable passed, will not work when people are signed in. ' +
					'If this is intentional, pass `null` to member'
			);
		}

		return this.state.textArea === null ? (
			<Loader />
		) : (
			<this.state.textArea.default
				account={this.props.account}
				boxStyles={this.props.boxStyles}
				fullWidth={this.props.fullWidth}
				index={this.props.index}
				inputStyles={this.props.inputStyles}
				member={this.props.member}
				name={this.props.name}
				onChange={this.props.onChange}
				onInitialize={this.props.onInitialize}
				onUpdate={this.props.onUpdate}
				value={this.props.value}
			/>
		);
	}
}
