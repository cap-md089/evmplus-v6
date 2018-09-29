import * as React from 'react';
import Button from '../Button';
import { InputProps } from './Input';
import './ListEditor.css';

interface ListEditorProps<T> extends InputProps<T[]> {
	inputComponent: new () => React.Component<InputProps<T>>;
	addNew: () => T;
	allowChange?: boolean;
	buttonText?: string;
	removeText?: string;
	fullWidth?: boolean;
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
			<div
				className="formbox"
				style={{
					clear: this.props.fullWidth ? 'both' : undefined,
					width: this.props.fullWidth ? '100%' : undefined,
					...this.props.boxStyles
				}}
			>
				<div className="listitems-edit">
					{(this.props.value || []).map((item, i) => (
						<div>
							<Input
								value={item}
								name=""
								key={i}
								onUpdate={this.getChangeHandler(i)}
								index={i}
							/>
							<Button buttonType="secondaryButton" onClick={this.getRemoveItem(i)} className="listEditor-removeItem">
								{this.props.removeText || 'Remove item'}
							</Button>
						</div>
					)).map((item, i) => (
						<>
							{item}
							{i === (this.props.value || []).length - 1 ? null : <div className="divider" />}
						</>
					))}
				</div>
				<div style={{
					clear: 'both',
					overflow: 'auto'
				}} />
				{
					this.props.fullWidth ?
						<div style={{
							width: 220,
							height: 2,
							float: 'left'
						}} /> : null
				}
				<div className="add-item">
					<Button buttonType="primaryButton" onClick={this.addItem}>
						{this.props.buttonText || 'Add item'}
					</Button>
				</div>
			</div>
		);
	}

	private getChangeHandler(index: number) {
		return (({ value }: { value: T; name: string }) => {
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

	private getRemoveItem(index: number) {
		return (() => {
			const value = (this.props.value || []).slice();

			value.splice(index, 1);

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value 
				});
			}

			if (this.props.onChange) {
				this.props.onChange(value);
			}
		}).bind(this);
	}
}
