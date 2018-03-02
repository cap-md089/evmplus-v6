import * as React from 'react';

import TextInput from './form-inputs/TextInput';
import FileInput from './form-inputs/FileInput';

/**
 * Creates a label to be used in the form
 */
class Label extends React.Component {
	public readonly IsLabel = true;

	constructor(props: {}) {
		super(props);

		this.IsLabel = true;
	}

	render() {
		return (
			<div className="formbox">
				{this.props.children}
			</div>
		);
	}
}

/**
 * Creates a title to use in the form
 */
class Title extends React.Component {
	public readonly IsLabel = true;

	constructor(props: {}) {
		super(props);

		this.IsLabel = true;
	}

	render() {
		return (
			<div className="formbar fheader">
				<div className="formbox">
					<h3>{this.props.children}</h3>
				</div>
			</div>
		);
	}
}

/**
 * Helper function
 * 
 * @param el 
 */
function isInput (el: React.ReactChild): boolean {
	if (typeof el === 'string' || typeof el === 'number') {
		return false;
	}
	return el.type === TextInput ||
		el.type === FileInput;
}

/**
 * The properties a form itself requires
 */
interface FormProps<T> {
	onSubmit: (fields: T) => void;
	submitInfo?: {
		text: string,
		className?: string
	};
	id: string; // Make it long!
}

/**
 * The form itself
 * 
 * To use with type checking in the submit function, you can do something similar to the following:
 * @example
 * type SampleForm = new () => Form<{}>
 * let SampleForm = Form as SampleForm
 * // <SampleForm /> now works as Form<{}>
 */
export default class Form<T> extends React.Component<FormProps<T>, T> {
	protected fields: T;

	/**
	 * Create a form
	 * 
	 * ID is required
	 * SubmitInfo describes the submit button
	 * onSubmit is the callback to use when the form is submitted
	 * 
	 * @param {FormProps<T>} props The properties
	 */
	constructor (props: FormProps<T>) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.submit = this.submit.bind(this);

		this.fields = {} as T;
	}

	/**
	 * What is used to describe when a form element changes
	 * 
	 * @param {React.FormEvent<HTMLFormEvent>} e Event
	 */
	protected onChange (e: React.FormEvent<HTMLInputElement>) {
		this.fields[e.currentTarget.name] = e.currentTarget.value;
	}
	
	/**
	 * Function called when the form is submitted
	 * 
	 * @param {React.FormEvent<HTMLFormEvent>} e Event
	 */
	protected submit (e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		this.props.onSubmit(this.fields);
	}

	/**
	 * Render function for a React Component
	 * 
	 * @returns {JSX.Element} A form
	 */
	render () {
		let submitInfo = this.props.submitInfo === undefined ?
			{
				text: 'Submit',
				className: 'submit'
			} : Object.assign(
				{
					text: 'Submit',
					className: 'submit'
				},
				this.props.submitInfo
			);

		return (
			<form
				onSubmit={this.submit}
				className="asyncForm"
			>
				{
					React.Children.map(
						this.props.children,
						(
							child: React.ReactChild,
							i
						) => {
							if (typeof this.props.children === 'undefined' || this.props.children === null) {
								throw new TypeError('Some error occurred');
							}
							let ret;
							if (!isInput(child)) {
								// This algorithm handles labels for inputs by handling inputs
								// Puts out titles on their own line
								// Disregards spare labels and such
								if ((child as React.ReactElement<any>).type === Title) {
									return child;
								}
								return;
							} else {
								this.fields[(child as React.ReactElement<any>).props.name] =
									(child as React.ReactElement<any>).props.value || '';
								ret = [
									React.cloneElement(
										child as React.ReactElement<{
											onUpdate: (e: React.FormEvent<any>) => void,
											key: number
										}>,
										{
											onUpdate: this.onChange,
											key: Math.random()
										}
									)
								];
							}
							if (i > 0 &&
								typeof (this.props.children as React.ReactChild[])[i - 1] !== 'undefined' &&
								!isInput((this.props.children as React.ReactChild[])[i - 1])
							) {
								if (typeof this.props.children[i - 1] === 'string' ||
									typeof this.props.children[i - 1] === 'number') {
									ret.unshift(
										<Label key={Math.random()}>{this.props.children[i - 1]}</Label>
									);
								} else {
									if (this.props.children[i - 1].type !== Title) {
										ret.unshift(
											React.cloneElement(
												this.props.children[i - 1],
												{
													key: Math.random()
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
										key={Math.random()}
									/>
								);
							}
							
							return <div key={i} className="formbar">{ret}</div>;
						}
					)}
				<div className="formbar">
					<div
						className="formbox"
						style={{
							height: '2px'
						}}
					/>
					<div
						className="formbox"
					>
						<input
							type="submit"
							value={submitInfo.text}
							className={submitInfo.className}
						/>
					</div>
				</div>
			</form>
		);
	}
}

export {
	Title,
	Label,
	TextInput,
	FileInput
};