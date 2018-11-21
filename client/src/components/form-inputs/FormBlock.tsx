import * as React from 'react';
import {
	isFullWidthableElement,
	isInput,
	isLabel,
	Label,
	Title
} from '../SimpleForm';

interface FormBlockProps<V> extends React.HTMLAttributes<HTMLDivElement> {
	name: string;
	onUpdate?: (
		e: {
			name: string;
			value: any;
		}
	) => void;
	onInitialize?: (
		e: {
			name: string;
			value: any;
		}
	) => void;
	value?: V;
}

export default class FormBlock<T extends object> extends React.Component<
	FormBlockProps<T>
> {
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
						const value =
							typeof this.props.value !== 'undefined' && this.props.value !== null
								? typeof this.props.value[child.props.name] ===
								  'undefined'
									? ''
									: this.props.value[child.props.name]
								: typeof child.props.value === 'undefined'
									? ''
									: child.props.value;
						if (!this.fields[child.props.name]) {
							this.fields[child.props.name] = value;
						}
						if (isFullWidthableElement(child)) {
							fullWidth = child.props.fullWidth;
						}
						if (typeof fullWidth === 'undefined') {
							fullWidth = false;
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
						typeof (this.props.children as React.ReactChild[])[
							i - 1
						] !== 'undefined' &&
						!isInput(this.props.children[i - 1])
					) {
						if (
							typeof this.props.children[i - 1] === 'string' ||
							typeof this.props.children[i - 1] === 'number'
						) {
							ret.unshift(
								<Label key={i - 1} fullWidth={fullWidth}>
									{this.props.children[i - 1]}
								</Label>
							);
						} else {
							if (this.props.children[i - 1].type !== Title) {
								ret.unshift(
									// @ts-ignore
									React.cloneElement(
										this.props.children[i - 1],
										{
											key: i - 1,
											onUpdate: this.onUpdate,
											onInitialize: this.onInitialize
										}
									)
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
		this.fields[e.name] = e.value;
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.fields
			});
		}
	}

	private onInitialize(e: { name: string; value: any }) {
		this.fields[e.name] = e.value;
		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.fields
			});
		}
	}
}
