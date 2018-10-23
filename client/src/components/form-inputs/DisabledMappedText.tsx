import * as React from 'react';
import { InputProps } from './Input';

export default class DisabledMappedText<T extends object> extends React.Component<InputProps<T>> {
	public render() {
		return (
			<div className="formbox">
				<input
					type="text"
					value={(this.props.value || {})[this.props.name]}
					name={"disabledinput"}
					disabled={true}
				/>
			</div>
		);
	}
}
