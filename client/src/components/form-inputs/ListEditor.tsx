import * as React from 'react';
import Button from '../Button';
import { InputProps } from './Input';

interface ListEditorProps<T> extends InputProps<T[]> {
	inputComponent: new () => React.Component<InputProps<T>>;
	addNew: () => T;
	allowChange?: boolean;
	buttonText?: string;
}

export default class ListEditor<T> extends React.Component<ListEditorProps<T>> {
	constructor(props: ListEditorProps<T>) {
		super(props);

		this.addItem = this.addItem.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || []
			});
		}
	}

	public render() {
		const Input = this.props.inputComponent;

		return (
			<div className="formbox" style={this.props.boxStyles}>
				<div className="listitems-edit">
					{(this.props.value || []).map((item, i) => (
						<Input
							value={item}
							name=""
							key={i}
							onChange={this.getChangeHandler(i)}
						/>
					))}
				</div>
				<div className="add-item" style={{clear: 'both'}}>
					<Button buttonType="primaryButton" onClick={this.addItem}>
						{this.props.buttonText || 'Add item'}
					</Button>
				</div>
			</div>
		);
	}

	private getChangeHandler(index: number) {
		return ((value: T) => {
			const oldValues = (this.props.value || []).slice();

			oldValues[index] = value;

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: oldValues
				});
			}

			if (this.props.onChange) {
				this.props.onChange(oldValues);
			}

			return typeof this.props.allowChange === 'undefined'
				? true
				: this.props.allowChange;
		}).bind(this);
	}

	private addItem() {
		const oldValues = (this.props.value || []).slice();

		oldValues.push(this.props.addNew());


		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: oldValues
			});
		}

		if (this.props.onChange) {
			this.props.onChange(oldValues);
		}

	}
}
