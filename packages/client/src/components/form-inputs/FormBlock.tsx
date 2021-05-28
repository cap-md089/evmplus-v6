/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import {
	isFullWidthableElement,
	isInput,
	isLabel,
	Label,
	Title,
	FormValidator,
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
		fieldChanged: keyof V,
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
	public state: FormBlockState<T> = {
		fieldsError: {} as BooleanForField<T>,
		fieldsChanged: {} as BooleanForField<T>,
	};

	public constructor(props: FormBlockProps<T>) {
		super(props);

		this.onUpdate = this.onUpdate.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
		this.render = this.render.bind(this);
	}

	public static getDerivedStateFromProps<T>(
		props: FormBlockProps<T>,
		state: FormBlockState<T>,
	): FormBlockState<T> {
		if (!props.value) {
			return {
				fieldsError: {},
				fieldsChanged: {},
			} as FormBlockState<T>;
		}

		const newState: FormBlockState<T> = {
			fieldsChanged: { ...state.fieldsChanged },
			fieldsError: {} as BooleanForField<T>,
		};

		// eslint-disable-next-line guard-for-in
		for (const _ in props.value) {
			const i: keyof T = _;

			if (props.validator && props.validator[i]) {
				const validator = props.validator[i];

				if (validator && !validator(props.value[i], props.value)) {
					newState.fieldsError[i] = true;
				}
			}
		}

		return newState;
	}

	public render(): JSX.Element {
		// This is to prevent React and the DOM from throwing warnings about how name, onInitialize, and onUpdate cannot be part of a div
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { onInitialize, onUpdate, name, value, children, ...props } = this.props;

		const usedChildren = Array.isArray(children)
			? children.flatMap(f => (Array.isArray(f) ? f : [f]))
			: null;
		return (
			<div {...props} style={{ gridColumn: '1 / 3', boxSizing: 'border-box' }}>
				{usedChildren?.map((child, i) => {
					let ret;
					let fullWidth = false;
					if (!isInput(child)) {
						// This algorithm handles labels for inputs by handling inputs
						// Puts out titles on their own line
						// Disregards spare labels and such
						if (isLabel(child) && child.type === Title) {
							return child;
						}
						return null;
					} else {
						const childName: keyof T = child.props.name as keyof T;

						const childValue = (typeof child.props.value !== 'undefined'
							? child.props.value
							: typeof value === 'undefined'
							? ''
							: this.props.value === null || this.props.value === undefined
							? ''
							: this.props.value[childName]) as T[typeof childName];
						if (
							!(value === null || typeof value === 'undefined') &&
							typeof value[childName] === 'undefined'
						) {
							value[childName] = childValue;
						}

						if (isFullWidthableElement(child)) {
							fullWidth = !!child.props.fullWidth;
						}
						if (typeof fullWidth === 'undefined') {
							fullWidth = false;
						}

						if (child.type === FormBlock) {
							fullWidth = true;
						}

						ret = [
							React.cloneElement(child, {
								key: i,
								onUpdate: this.onUpdate,
								onInitialize: this.onInitialize,
								value: childValue,
							}),
						];
					}
					if (
						i > 0 &&
						typeof usedChildren[i - 1] !== 'undefined' &&
						usedChildren[i - 1] !== null &&
						!isInput(usedChildren[i - 1])
					) {
						if (
							typeof usedChildren === 'string' ||
							typeof usedChildren === 'number' ||
							typeof usedChildren === 'boolean'
						) {
							return null;
						}

						if (!Array.isArray(usedChildren)) {
							return null;
						}

						const previousChild = usedChildren[i - 1];

						if (
							typeof previousChild === 'string' ||
							typeof previousChild === 'number' ||
							typeof previousChild === 'undefined' ||
							previousChild === null
						) {
							ret.unshift(
								<Label key={i - 1} fullWidth={fullWidth}>
									{previousChild}
								</Label>,
							);
						} else {
							if (isLabel(previousChild) && previousChild.type !== Title) {
								ret.unshift(
									React.cloneElement(previousChild, {
										key: i - 1,
										onUpdate: this.onUpdate,
										onInitialize: this.onInitialize,
									}),
								);
							}
						}
					} else {
						ret.unshift(
							<div
								className="input-formbox"
								style={{
									height: 2,
								}}
								key={i - 1}
							/>,
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

	private onUpdate = (e: { name: string; value: any }): void => {
		this.handleChange(e, true);
	};

	private handleChange = (e: { name: string; value: any }, hasChanged: boolean): void => {
		const name = e.name as keyof T;

		const value: T = { ...this.props.value } as T;
		const fieldsChanged = { ...this.state.fieldsChanged };
		const fieldsError = { ...this.state.fieldsError };

		value[name] = e.value as T[typeof name];
		fieldsChanged[name] = hasChanged;

		this.setState(
			{
				fieldsChanged,
				fieldsError,
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
						name,
					);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value,
					});
				}
			},
		);
	};

	private onInitialize = (e: { name: string; value: any }): void => {
		this.handleChange(e, false);
	};
}
