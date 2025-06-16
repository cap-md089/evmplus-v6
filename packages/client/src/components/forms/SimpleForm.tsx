/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import MemberSelector from '../dialogues/MemberSelector';
// Form inputs
import BigTextBox from '../form-inputs/BigTextBox';
import Checkbox from '../form-inputs/Checkbox';
import DateTimeInput from '../form-inputs/DateTimeInput';
import DisabledMappedText from '../form-inputs/DisabledMappedText';
import DisabledText from '../form-inputs/DisabledText';
import FileInput from '../form-inputs/FileInput';
import FormBlock from '../form-inputs/FormBlock';
import { InputProps } from '../form-inputs/Input';
import ListEditor from '../form-inputs/ListEditor';
import OtherMultCheckbox from '../form-inputs/OtherMultCheckbox';
import MultiRange from '../form-inputs/MultiRange';
import NumberInput from '../form-inputs/NumberInput';
import PasswordForm from '../form-inputs/PasswordForm';
import PermissionsEdit from '../form-inputs/PermissionsEdit';
import POCInput from '../form-inputs/POCInput';
import RadioButtonWithOther from '../form-inputs/RadioButtonWithOther';
import ReCAPTCHAInput from '../form-inputs/ReCAPTCHA';
import Select from '../form-inputs/Select';
import Selector from '../form-inputs/Selector';
import SimpleRadioButton from '../form-inputs/SimpleRadioButton';
import TeamMemberInput from '../form-inputs/TeamMemberInput';
import TeamSelector from '../form-inputs/TeamSelector';
import TextBox from '../form-inputs/TextBox';
import TextInput from '../form-inputs/TextInput';
import SimpleMultCheckbox from '../form-inputs/SimpleMultCheckbox';
import LaxAutocomplete from '../form-inputs/LaxAutocomplete';
import './Form.css';
import {
	ContactInput,
	ContactInstanceInput,
	PasswordType,
} from '../../pages/account/CreateProspectiveMember';
import EnumRadioButton from '../form-inputs/EnumRadioButton';
import EnumSelect from '../form-inputs/EnumSelect';
import { FileControlListItemInput } from '../form-inputs/FileControlListItemInput';

const saveMessage = {
	marginLeft: 10,
};

const hiddenStyles = {
	display: 'none',
};

export const defaultFullWidthElements: Array<React.JSXElementConstructor<any> | string> = [
	FormBlock,
	TeamSelector,
];

/**
 * Creates a label to be used in the form
 */
class Label extends React.Component<{
	fullWidth?: boolean;
	style?: React.CSSProperties;
	id?: string;
}> {
	public readonly IsLabel = true;

	public render = (): JSX.Element => (
		<div className="label-formbox has-content" style={this.props.style} id={this.props.id}>
			{this.props.children}
		</div>
	);
}

class Divider extends React.Component {
	public render = (): JSX.Element => <div className="divider" />;
}

const fullWidth = {
	width: '100%',
};

/**
 * Creates a title to use in the form
 */
class Title extends React.Component<{ fullWidth?: boolean; id?: string }> {
	public readonly IsLabel = true;

	public static GenerateID = (id: string): string =>
		id.toLocaleLowerCase().replace(/ +/g, '-').replace(/\//g, '');

	public render = (): JSX.Element => {
		const id = this.props.id
			? Title.GenerateID(this.props.id)
			: typeof this.props.children === 'string'
			? Title.GenerateID(this.props.children)
			: '';

		return (
			<div
				className="form-header"
				style={{
					...fullWidth,
					boxSizing: 'border-box',
					gridColumn: '1 / 3',
				}}
			>
				<h3 id={id}>{this.props.children}</h3>
			</div>
		);
	};
}

/**
 * Helper function
 *
 * @param el
 */
export function isInput(pel: React.ReactNode): pel is React.ReactElement<InputProps<any>> {
	if (typeof pel !== 'object' || pel === null) {
		return false;
	}

	const el = pel as React.ReactElement<any>;

	return (
		el.type === TextInput ||
		el.type === MultiRange ||
		el.type === DateTimeInput ||
		el.type === RadioButtonWithOther ||
		el.type === OtherMultCheckbox ||
		el.type === Checkbox ||
		el.type === ListEditor ||
		el.type === FormBlock ||
		el.type === SimpleRadioButton ||
		el.type === TextBox ||
		el.type === NumberInput ||
		el.type === Selector ||
		el.type === BigTextBox ||
		el.type === DisabledMappedText ||
		el.type === DisabledText ||
		el.type === TeamSelector ||
		el.type === MemberSelector ||
		el.type === TeamMemberInput ||
		el.type === POCInput ||
		el.type === Select ||
		el.type === FileInput ||
		el.type === PermissionsEdit ||
		el.type === ReCAPTCHAInput ||
		el.type === PasswordForm ||
		el.type === SimpleMultCheckbox ||
		el.type === ContactInput ||
		el.type === ContactInstanceInput ||
		el.type === PasswordType ||
		el.type === LaxAutocomplete ||
		el.type === EnumRadioButton ||
		el.type === EnumSelect ||
		el.type === 'textarea' ||
		el.type === FileControlListItemInput
	);
}

export const isHideableElement = (
	el: React.ReactElement<InputProps<any>> | React.ReactElement<InputProps<any>>,
): el is React.ReactElement<InputProps<any>> => typeof el.props.hidden !== 'undefined';

export const isFullWidthableElement = (
	el: React.ReactElement<InputProps<any>> | React.ReactElement<InputProps<any>>,
): el is React.ReactElement<InputProps<any>> => typeof el.props.fullWidth !== 'undefined';

/**
 * Similar helper function
 *
 * @param el
 */
export function isLabel(el: React.ReactNode): el is React.ReactElement<any> {
	if (
		typeof el === 'string' ||
		typeof el === 'number' ||
		el === null ||
		el === undefined ||
		typeof el === 'boolean'
	) {
		return false;
	}

	const pel = el as React.ReactElement<any>;

	return pel.type === Title || pel.type === Label || pel.type === Divider;
}

/**
 * Helper type used to represent the tracking of errors and changed fields
 */
export type BooleanFields<T> = { [K in keyof T]: boolean };

/**
 * The predicate function returns true if the value is a good one
 */
export type FormValidator<T> = { [K in keyof T]?: (value: T[K], allValues: T) => boolean };

/**
 * The properties a form itself requires
 */
export interface FormProps<F> {
	/**
	 * The function that is called when the user submits the form
	 *
	 * @param fields The fields of the form
	 */
	onSubmit?: (
		fields: F,
		error: BooleanFields<F>,
		changed: BooleanFields<F>,
		hasError: boolean,
	) => void;
	/**
	 * Styles the submit button
	 */
	submitInfo?: {
		/**
		 * The text for the submit button to use
		 */
		text: string;
		/**
		 * A CSS class to use
		 */
		className?: string;
		/**
		 * Whether or not the button is to be disabled
		 */
		disabled?: boolean;
	};
	/**
	 * The ID to identify the form with CSS
	 *
	 * Also used to 'save' the form; make it long so that it is unique!
	 *
	 * @deprecated Never implemented nor will ever be used
	 */
	id?: string;
	/**
	 * Determines whether or not to load a previously saved form
	 *
	 * @param saveTime How long ago was the form saved
	 * @param fields The fields to look at
	 *
	 * @returns Whether or not to load a previous save
	 *
	 * @deprecated Never implemented nor will ever be used
	 */
	shouldLoadPreviousFields?: (saveTime: number, fields: F) => boolean;
	/**
	 * Replaces the previous property
	 *
	 * Basically makes it so it uses a function that checks whether or not saveTime
	 * is less than the value specified
	 */
	saveCheckTime?: number;
	/**
	 * What to do on a form value changing
	 *
	 * Can be used to help with checking if a form field should be disabled
	 */
	onChange?: (
		fields: F,
		error: BooleanFields<F>,
		changed: BooleanFields<F>,
		hasError: boolean,
		fieldChanged: keyof F,
	) => void;
	/**
	 * Sets the values given the name. Allows for not having to set form values repeatedly
	 */
	values: F;
	/**
	 * Whether or not to show a submit button. This is nice for when a submit button is not
	 * nessecary
	 */
	showSubmitButton?: boolean;
	/**
	 * Validator for the form
	 *
	 * The predicate function returns true if the value is a good one
	 */
	validator?: FormValidator<F>;
	/**
	 * Submit message
	 *
	 * If the value is false, it doesn't dipslay anything
	 * This allows for stuff like this:
	 *
	 * successMessage={this.state.shouldDisplaySubmit && 'Saved!'}
	 *
	 * or
	 *
	 * successMessage={this.state.shouldDisplaySaved ? 'Saved' : this.state.shouldDisplayError && 'Failed'}
	 */
	successMessage?: false | string;
	/**
	 * Supplies a CSS class name
	 */
	className?: string;
	/**
	 * Disables the form when inputs are invalid
	 */
	disableOnInvalid?: boolean;
	/**
	 * Manual override for disabling the form
	 */
	formDisabled?: boolean;
}

/**
 * The form itself
 *
 * To use with type checking in the submit function, you can do something similar to the following:
 *
 * @example
 * type SampleForm = new () => Form<{x: string}>
 * let SampleForm = Form as SampleForm // Sometimes `as any as Sampleform`
 * // <SampleForm /> now works as Form<{x: string}>
 * <Form<{x: string}> />
 * // With TypeScript 2.8 Generics work with React components
 */
export default class SimpleForm<
	C extends {} = {},
	P extends FormProps<C> = FormProps<C>
> extends React.Component<
	P,
	{
		disabled: boolean;
	}
> {
	public state: { disabled: boolean } = { disabled: false };

	protected fieldsChanged: { [K in keyof C]: boolean } = {} as { [K in keyof C]: boolean };

	protected get fieldsError(): { [K in keyof C]: boolean } {
		const fieldsError = { ...this.fieldsChanged };

		for (const i in fieldsError) {
			if (fieldsError.hasOwnProperty(i)) {
				fieldsError[i] = false;
			}
		}

		if (this.props.validator) {
			for (const i in this.props.validator) {
				if (this.props.validator.hasOwnProperty(i)) {
					const field = i as keyof C;
					// @ts-ignore: this is something that can be checked manually
					fieldsError[field] = !this.props.validator[field](
						this.props.values[i],
						this.props.values,
					);
				}
			}
		}

		return fieldsError;
	}

	protected get hasError(): boolean {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		return (Object.values(this.fieldsError) as boolean[]).reduce(
			(prev, curr) => prev || curr,
			false,
		);
	}

	/**
	 * Render function for a React Component
	 *
	 * @returns {JSX.Element} A form
	 */
	public render(): JSX.Element {
		const submitInfo = {
			text: 'Submit',
			className: 'submit',
			disabled: this.props.formDisabled || this.hasError,
			...(this.props.submitInfo || {}),
		};

		return (
			<form className="form-async" onSubmit={this.submit}>
				{(this.props.children as Array<React.ReactNode | React.ReactNode[]>)
					.flatMap(node => (Array.isArray(node) ? node : [node]))
					.map((child, i, children) => {
						let ret;
						let childFullWidth = false;
						let hidden = false;
						if (
							typeof child === 'object' &&
							child !== null &&
							(child as React.ReactElement).type === 'div'
						) {
							ret = [child];
						} else if (!isInput(child)) {
							// This algorithm handles labels for inputs by handling inputs
							// Puts out titles on their own line
							// Disregards spare labels and such
							if (
								isLabel(child) &&
								(child.type === Title || child.type === Divider)
							) {
								return child;
							}
							return null;
						} else {
							hidden = isHideableElement(child) && !!child.props.hidden;

							const childName: keyof C = child.props.name as keyof C;
							const value = (typeof child.props.value !== 'undefined'
								? child.props.value
								: typeof this.props.values === 'undefined'
								? ''
								: typeof (this.props.values as C)[childName] === 'undefined'
								? ''
								: (this.props.values as C)[childName]) as C[typeof childName];

							// typeof this.props.values !== 'undefined'
							// 	? typeof this.props.values[
							// 			child.props.name
							// 	  ] === 'undefined'
							// 		? typeof child.props.value ===
							// 		  'undefined'
							// 			? ''
							// 			: child.props.value
							// 		: this.props.values[child.props.name]
							// 	: typeof child.props.value === 'undefined'
							// 	? ''
							// 	: child.props.value;
							if (isFullWidthableElement(child)) {
								childFullWidth = !!child.props.fullWidth;
							}
							if (typeof childFullWidth === 'undefined') {
								childFullWidth = false;
							}

							if (defaultFullWidthElements.includes(child.type)) {
								childFullWidth = true;
							}

							ret = [
								React.cloneElement(child, {
									onUpdate: this.onChange,
									onInitialize: this.onInitialize,
									key: i + 1,
									value,
									hasError:
										this.fieldsChanged[childName] &&
										this.fieldsError[childName],
								}),
							];
						}
						if (!childFullWidth) {
							if (
								i > 0 &&
								typeof children[i - 1] !== 'undefined' &&
								children[i - 1] !== null &&
								!isInput(children[i - 1])
							) {
								if (
									typeof children === 'string' ||
									typeof children === 'number' ||
									typeof children === 'boolean'
								) {
									return null;
								}

								if (!Array.isArray(children)) {
									return null;
								}

								const previousChild = children[i - 1];

								if (
									typeof previousChild === 'string' ||
									typeof previousChild === 'number' ||
									typeof previousChild === 'undefined' ||
									previousChild === null
								) {
									ret.unshift(
										<Label key={i - 1} fullWidth={childFullWidth}>
											{previousChild}
										</Label>,
									);
								} else {
									if (isLabel(previousChild) && previousChild.type !== Title) {
										ret.unshift(
											React.cloneElement(previousChild, {
												onUpdate: this.onChange,
												onInitialize: this.onInitialize,
												key: i,
											}),
										);
									}
								}
							}
						}

						if (ret.length === 1 && !childFullWidth) {
							ret.unshift(<div key={i - 1} className="label-formbox" />);
						}

						return (
							<div
								key={i}
								className={`formbar${childFullWidth ? ' fullwidth' : ''}`}
								style={hidden ? hiddenStyles : undefined}
							>
								{ret}
							</div>
						);
					})}
				{(
					typeof this.props.showSubmitButton === 'undefined'
						? true
						: this.props.showSubmitButton
				) ? (
					<div className="formbar">
						<div className="label-formbox" />
						<div className="input-formbox">
							<input
								type="submit"
								value={submitInfo.text}
								className={`primaryButton ${submitInfo.className}`}
								disabled={
									this.props.formDisabled ||
									(this.props.disableOnInvalid && this.hasError) ||
									submitInfo.disabled
								}
							/>
							{this.props.successMessage && (
								<span style={saveMessage}>{this.props.successMessage}</span>
							)}
						</div>
					</div>
				) : null}
				<div
					style={{
						overflow: 'auto',
						clear: 'both',
						height: 1,
					}}
				/>
			</form>
		);
	}

	/**
	 * What is used to describe when a form element changes
	 */
	protected onChange = (e: { name: string; value: any }): void => {
		const name = e.name as keyof C;
		const fields = { ...this.props.values };
		fields[name] = e.value as C[typeof name];
		this.fieldsChanged[e.name as keyof C] = true;

		let error = false;
		const validator = this.props.validator
			? (this.props.validator[name as keyof P['validator']] as (
					val: C[typeof name],
					allVals: C,
			  ) => boolean)
			: null;
		if (validator) {
			error = !validator(e.value, fields);
		}
		this.fieldsError[e.name as keyof C] = error;

		this.props.onChange?.(fields, this.fieldsError, this.fieldsChanged, this.hasError, name);
	};

	protected onInitialize = (e: { name: string; value: any }): void => {
		const name = e.name as keyof C;
		const fields = { ...this.props.values };
		fields[name] = e.value as C[typeof name];
		this.fieldsChanged[e.name as keyof C] = false;

		let error = false;
		const validator = this.props.validator
			? (this.props.validator[name as keyof P['validator']] as (
					val: C[typeof name],
					allVals: C,
			  ) => boolean)
			: null;
		if (validator) {
			error = !validator(e.value, fields);
		}
		this.fieldsError[e.name as keyof C] = error;

		this.props.onChange?.(fields, this.fieldsError, this.fieldsChanged, this.hasError, name);
	};

	/**
	 * Function called when the form is submitted
	 *
	 * @param {React.MouseEvent<HTMLInputElement>} e Event
	 */
	protected submit = (e: React.FormEvent<HTMLFormElement>): void => {
		e.preventDefault();
		if (typeof this.props.onSubmit !== 'undefined') {
			this.props.onSubmit(
				this.props.values,
				this.fieldsError,
				this.fieldsChanged,
				this.hasError,
			);
		}
	};
}

/**
 * Adds some extra properties for management of simpler classes
 */
export interface BasicFormProps<T> extends FormProps<T> {
	/**
	 * Class names for each row
	 */
	rowClassName?: string;
	/**
	 * Class for the form
	 */
	className?: string;
}

const clearFix: React.CSSProperties = {
	clear: 'both',
};

/**
 * The form itself
 *
 * To use with type checking in the submit function, you can do something similar to the following:
 *
 * @example
 * type SampleForm = new () => Form<{x: string}>
 * let SampleForm = Form as SampleForm // Sometimes `as any as Sampleform`
 * // <SampleForm /> now works as Form<{x: string}>
 */
export class Form<C = {}, P extends BasicFormProps<C> = BasicFormProps<C>> extends SimpleForm<
	C,
	P
> {
	/**
	 * Render function for a React Component
	 *
	 * @returns {JSX.Element} A form
	 */
	public render(): JSX.Element {
		const submitInfo =
			this.props.submitInfo === undefined
				? {
						text: 'Submit',
						className: 'submit',
						disabled: false,
				  }
				: Object.assign(
						{
							text: 'Submit',
							className: 'submit',
							disabled: false,
						},
						this.props.submitInfo,
				  );

		return (
			<form
				className={`${this.props.className ? `${this.props.className ?? ''} ` : ''}`}
				onSubmit={this.submit}
			>
				{React.Children.map(this.props.children, (child: React.ReactNode, i) => {
					if (isInput(child)) {
						const childName: keyof C = child.props.name as keyof C;
						const value = (typeof this.props.values !== 'undefined'
							? typeof (this.props.values as C)[childName] === 'undefined'
								? ''
								: (this.props.values as C)[childName]
							: typeof child.props.value === 'undefined'
							? ''
							: child.props.value) as C[typeof childName];
						return (
							<div className={this.props.rowClassName || 'basic-form-bar'}>
								{React.cloneElement(child, {
									onUpdate: this.onChange,
									onInitialize: this.onInitialize,
									value,
									key: i,
								})}
							</div>
						);
					}
					return child;
				})}
				<div className={this.props.rowClassName || 'basic-form-bar'}>
					<input
						type="submit"
						value={submitInfo.text}
						className={`primaryButton ${submitInfo.className}`}
						disabled={
							(this.props.disableOnInvalid && this.hasError) || submitInfo.disabled
						}
					/>
				</div>
				<div style={clearFix} />
			</form>
		);
	}
}

export {
	Title,
	Label,
	Divider,
	FileInput,
	MultiRange,
	TextInput,
	DateTimeInput,
	RadioButtonWithOther,
	OtherMultCheckbox,
	Checkbox,
	ListEditor,
	FormBlock,
	SimpleRadioButton,
	TextBox,
	NumberInput,
	Selector,
	DisabledMappedText,
	BigTextBox,
	DisabledText,
	TeamSelector,
	MemberSelector,
	TeamMemberInput,
	PermissionsEdit,
};
