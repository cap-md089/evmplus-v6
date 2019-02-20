import * as React from 'react';
import { isFullWidthableElement, isInput, isLabel, Label, Title } from '../forms/SimpleForm';

interface FormBlockProps<V> extends React.HTMLAttributes<HTMLDivElement> {
	name: string;
	onUpdate?: (e: { name: string; value: any }) => void;
	onInitialize?: (e: { name: string; value: any }) => void;
	value?: V;
}

export default class FormBlock<T extends object> extends React.Component<FormBlockProps<T>> {
	private fields = {} as T;

	constructor(props: FormBlockProps<T>) {
		super(props);

		this.onUpdate = this.onUpdate.bind(this);
		this.onInitialize = this.onInitialize.bind(this);

		this.render = this.render.bind(this);

		this.fields = this.props.value || this.fields;
	}

	public render() {
		const props = Object.assign({}, this.props);

		// @ts-ignore
		delete props.onInitialize;
		// @ts-ignore
		delete props.onUpdate;
		// @ts-ignore
		delete props.name;

		return (
			<div {...props}>
				{React.Children.map(this.props.children, (child, i) => {
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
								: typeof (this.props.value as T)[childName] === 'undefined'
								? ''
								: (this.props.value as T)[childName];
						if (typeof this.fields[childName] === 'undefined') {
							this.fields[childName] = value;
						}
						if (isFullWidthableElement(child)) {
							fullWidth = child.props.fullWidth;
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
						const children = this.props.children;
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

						const child = children[i - 1];

						if (
							typeof child === 'string' ||
							typeof child === 'number' ||
							typeof child === undefined ||
							typeof child === null
						) {
							ret.unshift(
								<Label key={i - 1} fullWidth={fullWidth}>
									{child}
								</Label>
							);
						} else {
							// @ts-ignore
							if (isInput(child!) && child!.type !== Title) {
								ret.unshift(
									// @ts-ignore
									React.cloneElement(child, {
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
								className="formbox"
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
		const name = e.name as keyof T;
		this.fields[name] = e.value;
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.fields
			});
		}
	}

	private onInitialize(e: { name: string; value: any }) {
		const name = e.name as keyof T;
		this.fields[name] = e.value;
		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.fields
			});
		}
	}
}
