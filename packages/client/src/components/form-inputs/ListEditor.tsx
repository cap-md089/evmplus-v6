/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import Button from '../Button';
import { InputProps } from './Input';
import './ListEditor.css';
import { Omit } from 'react-router';

export type ProvidedKeys = 'value' | 'name' | 'onUpdate' | 'index';

const clearFix: React.CSSProperties = {
	content: '',
	clear: 'both',
	height: 15
};

const upperMargin = {
	marginTop: 10
};

export interface ListEditorProps<T, P extends InputProps<T>, R extends React.ComponentType<P>>
	extends InputProps<T[]> {
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
				className="input-formbox list-editor"
				style={{
					clear: this.props.fullWidth ? 'both' : undefined,
					width: this.props.fullWidth ? '100%' : undefined,
					...this.props.boxStyles
				}}
			>
				{this.props.hasError && this.props.errorMessage ? (
					<div className="text-error">{this.props.errorMessage}</div>
				) : null}
				<div className="listitems-edit">
					{(this.props.value || [])
						.map((value, index) => {
							const extraProps: Omit<P, ProvidedKeys> = this.props.extraProps;
							const knownProps: Pick<P, ProvidedKeys> = {
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

							// @ts-ignore
							const input = <Input {...props} />;

							return (
								<div key={index}>
									{input}
									{this.props.fullWidth ? (
										<div
											style={{
												width: 220,
												height: 2,
												float: 'left'
											}}
										/>
									) : null}
									<div className="remove-item">
										<Button
											buttonType="secondaryButton"
											onClick={this.getRemoveItem(index)}
											className={`listEditor-removeItem${props.fullWidth}`}
										>
											{this.props.removeText || 'Remove item'}
										</Button>
									</div>
									{this.props.fullWidth ? <div style={clearFix} /> : null}
								</div>
							);
						})
						.map((item, i) => (
							<div key={i}>
								{item}
								{i === (this.props.value || []).length - 1 ? null : (
									<div className="divider listeditor-divider" />
								)}
							</div>
						))}
				</div>
				{this.props.fullWidth ? (
					<div
						style={{
							width: 220,
							height: 2,
							float: 'left'
						}}
					/>
				) : null}
				<div
					className="add-item"
					style={this.props.value?.length ? upperMargin : undefined}
				>
					<Button buttonType="primaryButton" onClick={this.addItem}>
						{this.props.buttonText || 'Add item'}
					</Button>
				</div>
				<div style={clearFix} />
			</div>
		);
	}

	private getChangeHandler(index: number) {
		return ({ value }: { value: T; name: string }) => {
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

			return typeof this.props.allowChange === 'undefined' ? true : this.props.allowChange;
		};
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
		return () => {
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
		};
	}
}
