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
import {
	isFullWidthableElement,
	isInput,
	isLabel,
	Label,
	Title,
	FormValidator
} from '../forms/SimpleForm';

interface FormBlockProps<V> extends React.HTMLAttributes<HTMLDivElement> {
	name: string;
	onUpdate?: (e: { name: string; value: any }) => void;
	onInitialize?: (e: { name: string; value: any }) => void;
	value?: V;

	validator?: FormValidator<V>;

	onFormChange?: (
		fields: V,
		error: BooleanForField<V>,
		changed: BooleanForField<V>,
		hasError: boolean,
		fieldChanged: keyof V
	) => void;
}

export type BooleanForField<T> = { [K in keyof T]: boolean };

interface FormBlockState<V> {
	fieldsError: BooleanForField<V>;
	fieldsChanged: BooleanForField<V>;
}

export default class FormBlock<T extends object> extends React.Component<
	FormBlockProps<T>,
	FormBlockState<T>
> {
	public static getDerivedStateFromProps<T>(
		props: FormBlockProps<T>,
		state: FormBlockState<T>
	): FormBlockState<T> {
		if (!props.value) {
			return {
				fieldsError: {},
				fieldsChanged: {}
			} as FormBlockState<T>;
		}

		const newState: FormBlockState<T> = {
			fieldsChanged: { ...state.fieldsChanged },
			fieldsError: {} as BooleanForField<T>
		};

		// tslint:disable-next-line: forin
		for (const _ in props.value) {
			const i: keyof T = _;

			if (props.validator && props.validator[i]) {
				const validator = props.validator[i]!;

				if (!validator(props.value[i], props.value)) {
					newState.fieldsError[i] = true;
				}
			}
		}

		return newState;
	}

	public state: FormBlockState<T> = {
		fieldsError: {} as BooleanForField<T>,
		fieldsChanged: {} as BooleanForField<T>
	};

	constructor(props: FormBlockProps<T>) {
		super(props);

		this.onUpdate = this.onUpdate.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
		this.render = this.render.bind(this);
	}

	public render() {
		const props = Object.assign({}, this.props);

		const children = props.children instanceof Array ? props.children.flatMap(f => f) : null;

		// @ts-ignore
		delete props.onInitialize;
		// @ts-ignore
		delete props.onUpdate;
		// @ts-ignore
		delete props.name;

		return (
			<div {...props}>
				{React.Children.map(children, (child, i) => {
					if (
						typeof this.props.children === 'undefined' ||
						this.props.children === null
					) {
						throw new TypeError('Some error occurred');
					}
					let ret;
					let fullWidth = false;
					if (!isInput(child)) {
						// This algorithm handles labels for inputs by handling inputs
						// Puts out titles on their own line
						// Disregards spare labels and such
						if (isLabel(child) && child.type === Title) {
							return child;
						}
						return;
					} else {
						const childName: keyof T = child.props.name as keyof T;

						const value =
							typeof child.props.value !== 'undefined'
								? child.props.value
								: typeof this.props.value === 'undefined'
								? ''
								: this.props.value === null ||
								  typeof (this.props.value as T)[childName] === 'undefined'
								? ''
								: this.props.value![childName];
						if (
							!(
								this.props.value === null || typeof this.props.value === 'undefined'
							) &&
							typeof this.props.value![childName] === 'undefined'
						) {
							this.props.value![childName] = value;
						}

						if (isFullWidthableElement(child)) {
							fullWidth = !!child.props.fullWidth;
						}
						if (typeof fullWidth === 'undefined') {
							fullWidth = false;
						}

						// @ts-ignore
						if (child.type === FormBlock) {
							fullWidth = true;
						}

						ret = [
							React.cloneElement(child, {
								key: i,
								onUpdate: this.onUpdate,
								onInitialize: this.onInitialize,
								value
							})
						];
					}
					if (
						i > 0 &&
						typeof (this.props.children as React.ReactChild[])[i - 1] !== 'undefined' &&
						(this.props.children as React.ReactChild[])[i - 1] !== null &&
						!isInput((this.props.children as React.ReactChild[])[i - 1])
					) {
						if (
							typeof children === 'string' ||
							typeof children === 'number' ||
							typeof children === 'boolean'
						) {
							return;
						}

						if (!Array.isArray(children)) {
							return;
						}

						const previousChild = children[i - 1];

						if (
							typeof previousChild === 'string' ||
							typeof previousChild === 'number' ||
							typeof previousChild === 'undefined' ||
							previousChild === null
						) {
							ret.unshift(
								<Label key={i - 1} fullWidth={fullWidth}>
									{previousChild}
								</Label>
							);
						} else {
							// @ts-ignore
							if (isLabel(previousChild!) && previousChild!.type !== Title) {
								ret.unshift(
									// @ts-ignore
									React.cloneElement(previousChild, {
										key: i - 1,
										onUpdate: this.onUpdate,
										onInitialize: this.onInitialize
									})
								);
							}
						}
					} else {
						ret.unshift(
							<div
								className="input-formbox"
								style={{
									height: 2
								}}
								key={i - 1}
							/>
						);
					}

					return (
						<div key={i} className="formbar">
							{ret}
						</div>
					);
				})}
			</div>
		);
	}

	private onUpdate(e: { name: string; value: any }) {
		this.handleChange(e, true);
	}

	private handleChange(e: { name: string; value: any }, hasChanged: boolean) {
		const name = e.name as keyof T;

		const value: T = { ...this.props.value } as T;
		const fieldsChanged = { ...this.state.fieldsChanged };
		const fieldsError = { ...this.state.fieldsError };

		value[name] = e.value;
		fieldsChanged[name] = hasChanged;

		this.setState(
			{
				fieldsChanged,
				fieldsError
			},
			() => {
				let hasError = false;
				for (const i in this.state.fieldsError) {
					if (this.state.fieldsError.hasOwnProperty(i)) {
						hasError = fieldsError[i];
						if (hasError) {
							break;
						}
					}
				}

				// DO NOT TOUCH
				// If this is moved into the conditional TypeScript gets upset
				const onChange = this.props.onFormChange;

				if (onChange !== undefined) {
					onChange(
						value,
						this.state.fieldsError,
						this.state.fieldsChanged,
						hasError,
						name
					);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value
					});
				}
			}
		);
	}

	private onInitialize(e: { name: string; value: any }) {
		this.handleChange(e, false);
	}
}
