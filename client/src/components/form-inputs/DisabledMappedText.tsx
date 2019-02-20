import * as React from 'react';
import { InputProps } from './Input';

interface MappedTextProps<T, N extends Extract<keyof T, string> = Extract<keyof T, string>> extends InputProps<T> {
	name: N;
	value: T[N] extends string ? T : never;
}

export default class DisabledMappedText<T> extends React.Component<MappedTextProps<T>> {
	public render() {
		return (
			<div className="formbox">
				<input
					type="text"
					value={(this.props.value || {} as T)[this.props.name] as unknown as string}
					name={"disabledinput"}
					disabled={true}
				/>
			</div>
		);
	}
}
