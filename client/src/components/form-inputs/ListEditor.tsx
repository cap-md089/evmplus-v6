import * as React from 'react';
import Button from '../Button';
import { InputProps } from './Input';
import './ListEditor.css';

type ProvidedKeys = 'value' | 'name' | 'onUpdate' | 'index';

const clearFix: React.CSSProperties = {
	content: '',
	clear: 'both',
	height: 15
};

interface ListEditorProps<
	T,
	P extends InputProps<T>,
	R extends React.ComponentType<P>
> extends InputProps<T[]> {
	inputComponent: R;
	addNew: () => T;
	allowChange?: boolean;
	buttonText?: string;
	removeText?: string;
	fullWidth?: boolean;
	extraProps: Omit<P, ProvidedKeys>;
}

export default class ListEditor<
	T,
	P extends InputProps<T> = InputProps<T>,
	R extends React.ComponentType<P> = React.ComponentType<P>
> extends React.Component<ListEditorProps<T, P, R>> {
	constructor(props: ListEditorProps<T, P, R>) {
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
					{(this.props.value || [])
						.map((value, index) => {
							const extraProps: Omit<P, ProvidedKeys> = this.props
								.extraProps;
							const knownProps: Pick<P, ProvidedKeys> = {
								// Don't know why T doesn't equal P["value"]
								// @ts-ignore
								value,
								name: '',
								onUpdate: this.getChangeHandler(index),
								index
							};

							// Don't know why Omit<P, T> & Pick<P, T> doesn't equal P
							// @ts-ignore
							const props: P = {
								...knownProps,
								...extraProps
							};

							return (
								<div key={index}>
									<Input {...props} />
									{this.props.fullWidth ? (
										<div
											style={{
												width: 220,
												height: 2,
												float: 'left'
											}}
										/>
									) : null}
									<div className="add-item">
										<Button
											buttonType="secondaryButton"
											onClick={this.getRemoveItem(index)}
											className="listEditor-removeItem"
										>
											{this.props.removeText ||
												'Remove item'}
										</Button>
									</div>
									{this.props.fullWidth ? (
										<div
											style={clearFix}
										/>
									) : null}
								</div>
							);
						})
						.map((item, i) => (
							<div key={i}>
								{item}
								{i ===
								(this.props.value || []).length - 1 ? null : (
									<div className="divider" />
								)}
							</div>
						))}
				</div>
				<div
					style={{
						clear: 'both',
						overflow: 'auto'
					}}
				/>
				{this.props.fullWidth ? (
					<div
						style={{
							width: 220,
							height: 2,
							float: 'left'
						}}
					/>
				) : null}
				<div className="add-item">
					<Button buttonType="primaryButton" onClick={this.addItem}>
						{this.props.buttonText || 'Add item'}
					</Button>
				</div>
				<div style={clearFix} />
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
