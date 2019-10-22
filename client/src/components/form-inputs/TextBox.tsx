import * as React from 'react';
import { InputProps } from './Input';

// @ts-ignore
interface TextBoxProps extends InputProps<undefined> {
	name?: string;
}

export default class TextBox extends React.Component<TextBoxProps> {
	public render() {
		return (
			<div
				className="formbox"
				style={{ lineHeight: 'initial', paddingTop: 2, paddingBottom: 5 }}
			>
				{this.props.children}
			</div>
		);
	}
}
