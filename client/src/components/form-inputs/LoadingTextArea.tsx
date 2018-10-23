import * as React from 'react';
import Loader from '../Loader';
import { TextAreaProps } from './TextArea';

interface LoadingTextAreaState {
	textArea: typeof import('./TextArea') | null;
}

export default class LoadingTextArea extends React.Component<
	TextAreaProps,
	LoadingTextAreaState
> {
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
		return this.state.textArea === null ? (
			<Loader />
		) : (
			<this.state.textArea.default {...this.props} />
		);
	}
}
