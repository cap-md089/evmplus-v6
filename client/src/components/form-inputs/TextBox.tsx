import * as React from 'react';
import { InputProps } from './Input';

interface TextBoxProps extends InputProps<null> {}

export default class TextBox extends React.Component<TextBoxProps> {
	public render () {
		return (
			<div className="formbox">
				{this.props.children}
			</div>
		);
	}
}