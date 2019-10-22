import { InputProps } from './Input';
import * as React from 'react';
import './Select.css';

export interface SelectProps<E extends number> extends InputProps<E | -1> {
	labels: string[];
}

export default class Select<E extends number = number> extends React.Component<SelectProps<E>> {
	public state: {} = {};

	public constructor(props: SelectProps<E>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: typeof this.props.value !== 'number' ? -1 : this.props.value
			});
		}

		this.selectChange = this.selectChange.bind(this);
	}

	public render() {
		return (
			<div className="formbox" style={this.props.boxStyles}>
				<select
					className="select"
					value={(typeof this.props.value === 'undefined'
						? '-1'
						: this.props.value
					).toString()}
					onChange={this.selectChange}
				>
					{this.props.labels.map((label, i) => (
						<option key={i} value={i.toString()}>
							{label}
						</option>
					))}
				</select>
			</div>
		);
	}

	private selectChange(event: React.FormEvent<HTMLSelectElement>) {
		const value = parseInt(event.currentTarget.value.toString(), 10) as E;

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}
	}
}
