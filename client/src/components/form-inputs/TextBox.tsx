import * as React from 'react';
import { InputProps } from './Input';

export default class TextBox extends React.Component<InputProps<null>> {
	public render () {
		return (
			<div className="formbox">
				{this.props.children}
			</div>
		);
	}
}