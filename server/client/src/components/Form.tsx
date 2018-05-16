import * as React from 'react';

import TextInput from './form-inputs/TextInput';
import FileInput, { FileInputLoader, FileInputLoaderSelect } from './form-inputs/FileInput';
import TextArea from './form-inputs/TextArea';
import myFetch from '../lib/myFetch';

/**
 * Creates a label to be used in the form
 */
class Label extends React.Component<{fullWidth?: boolean}> {
	public readonly IsLabel = true;

	constructor(props: {fullWidth: boolean}) {
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
class Title extends React.Component<{fullWidth?: boolean}> {
	public readonly IsLabel = true;

	constructor(props: {fullWidth: boolean}) {
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
		el.type === FileInput ||
		el.type === FileInputLoader ||
		el.type === FileInputLoaderSelect ||
		el.type === TextArea;
}

/**
 * The properties a form itself requires
 */
export interface FormProps<F> {
	/**
	 * The function that is called when the user submits the form
	 * 
	 * @param fields The fields of the form
	 */
	onSubmit?: (fields: F, token: string) => void;
	/**
	 * Styles the submit button
	 */
	submitInfo?: {
		/**
		 * The text for the submit button to use
		 */
		text: string,
		/**
		 * A CSS class to use
		 */
		className?: string
	};
	/**
	 * The ID to identify the form with CSS
	 * 
	 * Also used to 'save' the form; make it long so that it is unique!
	 */
	id: string;
	/**
	 * Determines whether or not to load a previously saved form
	 * 
	 * @param saveTime How long ago was the form saved
	 * @param fields The fields to look at
	 * 
	 * @returns Whether or not to load a previous save
	 */
	shouldLoadPreviousFields?: (saveTime: number, fields: F) => boolean;
	/**
	 * Replaces the previous property
	 * 
	 * Basically makes it so it uses a function that checks whether or not saveTime
	 * is less than the value specified
	 */
	saveCheckTime?: number;
}

/**
 * The form itself
 * 
 * To use with type checking in the submit function, you can do something similar to the following:
 * @example
 * type SampleForm = new () => Form<{x: string}>
 * let SampleForm = Form as SampleForm // Sometimes `as any as Sampleform`
 * // <SampleForm /> now works as Form<{x: string}>
 */
class Form<
	C = {},
	P extends FormProps<C> = FormProps<C>
> extends React.Component<P, {
	disabled: boolean;
}> {
	protected fields: C;

	protected token: string = '';
	protected sessionID: string = '';

	protected displayLoadFields: boolean = false;
	protected loadedFields: C = {} as C;

	/**
	 * Create a form
	 * 
	 * ID is required
	 * SubmitInfo describes the submit button
	 * onSubmit is the callback to use when the form is submitted
	 * 
	 * @param {P} props The properties
	 */
	constructor (props: P) {
		super(props);

		this.state = {
			disabled: false
		};

		this.onChange = this.onChange.bind(this);
		this.submit = this.submit.bind(this);

		this.fields = {} as C;

		if (typeof localStorage !== 'undefined') {
			let fields = localStorage.getItem(`${this.props.id}-storage`);
			let time = 0;

			let saveTime = localStorage.getItem(`${this.props.id}-savetime`);
			if (saveTime) {
				time = Date.now() - parseInt(saveTime, 10);

				if (this.props.shouldLoadPreviousFields) {
					this.displayLoadFields = this.props.shouldLoadPreviousFields(
						time,
						fields ? JSON.parse(fields) : {}
					);
				} else if (typeof this.props.saveCheckTime !== 'undefined') {
					this.displayLoadFields = time < 1000 * 60 * 60 * 5;
				}
			} else {
				this.displayLoadFields = false;
			}
		} else {
			this.displayLoadFields = true;
		}

		let sid = localStorage.getItem('sessionID');
		if (sid) {
			myFetch(
				'/api/token',
				{
					headers: {
						authorization: sid
					}
				}
			).then(res =>
				res.json())
			.then(tokenObj =>
				this.token = tokenObj.token);
		}
	}

	/**
	 * What is used to describe when a form element changes
	 */
	protected onChange (e: {name: string, value: any}) {
		this.fields[e.name] = e.value;
	}
	
	/**
	 * Function called when the form is submitted
	 * 
	 * @param {React.FormEvent<HTMLFormEvent>} e Event
	 */
	protected submit (e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (typeof this.props.onSubmit !== 'undefined') {
			this.props.onSubmit(this.fields, this.token);
		}
	}

	/**
	 * Render function for a React Component
	 * 
	 * @returns {JSX.Element} A form
	 */
	render (): JSX.Element {
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
							let ret, fullWidth = false;
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
								fullWidth = (child as React.ReactElement<any>).props.fullWidth; 
								if (typeof fullWidth === 'undefined') {
									fullWidth = false;
								}
								ret = [
									React.cloneElement(
										child as React.ReactElement<{
											onUpdate: (e: {name: string, value: any}) => void,
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
										<Label
											key={i - 1}
											fullWidth={fullWidth}
										>
											{this.props.children[i - 1]}
										</Label>
									);
								} else {
									if (this.props.children[i - 1].type !== Title) {
										ret.unshift(
											React.cloneElement(
												this.props.children[i - 1],
												{
													key: i - 1
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
								<div
									key={i}
									className="formbar"
								>
									{ret}
								</div>
							);
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
							disabled={this.state.disabled}
						/>
					</div>
				</div>
			</form>
		);
	}
}

export default Form;

export {
	Title,
	Label,

	FileInput,
	FileInputLoader,
	FileInputLoaderSelect,
	
	TextInput,
	TextArea
};