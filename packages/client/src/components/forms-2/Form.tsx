/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org. It represents the actions, updates,
 * and views that can accomodate a form
 *
 * A form can have fields and a collapsed state. The fields represent
 * the actual inputs that are used to modify the model, while the
 * collapsed state is generated based off of the model fields. This case
 * is represented strongly by something that can be nullable while
 * editing, but when submitted it is important that the value is not
 * null, but actually present. This is what is called 'collapsing' in
 * this module; collapsing it from a larger, vague state to a clean
 * model or providing an error
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

import { Either, EitherObj, Maybe, MaybeObj } from 'common-lib';
import * as React from 'react';
import { Action, createAction, ProducerFor, SubComponent } from '../../redux-utils';

import './Forms.scss';

/**
 * Represents an error that can be displayed to the user
 */
export interface FormError {
	message: string;

	display?: boolean;
}

type BooleanFields<F extends {}> = {
	[P in keyof F]: boolean;
};

enum FormActionNames {
	Change = 'CHANGE_FORM',
	Submit = 'SUBMIT_FORM',
}

/**
 * Gets the action producer for when a form change event occurs
 *
 * Useful for creating a reducer to handle the change events
 *
 * @template Fields the form fields
 *
 * @returns {ProducerFor<FormFieldsChangeAction<Fields>>} an action producer for when
 * 	the form changes
 */
export function getChangeActionProducer<Fields>(): ProducerFor<FormFieldsChangeAction<Fields>> {
	return createAction(
		FormActionNames.Change,
		<K extends keyof Fields>(
			fields: Fields,
			fieldsChanged: BooleanFields<Fields>,
			name: K,
			newFieldValue: Fields[K],
		) => ({
			fields,
			name,
			fieldsChanged,
			newFieldValue,
		}),
	);
}

/**
 * Gets the action producer for when a form is submitted
 *
 * Useful for creating a reducer to handle the submit event
 *
 * @template Fields the form fields
 * @template Collapsed the collapsed form type
 *
 * @returns {ProducerFor<FormSubmitAction<Fields, Collapsed>>} an action
 * 	producer for when the form is submitted
 */
export function getSubmitActionProducer<Fields, Collapsed>(): ProducerFor<
	FormSubmitAction<Fields, Collapsed>
> {
	return createAction(
		FormActionNames.Submit,
		(fields: EitherObj<FormError[], Collapsed>, fieldsChanged: BooleanFields<Fields>) => ({
			fields,
			fieldsChanged,
		}),
	);
}

/**
 * An action which indicates that a field in the form has changed. This action also
 * indicates which fields in the form have been modified by the user and which field
 * was just changed, as well as the new value
 */
export type FormFieldsChangeAction<Fields, K extends keyof Fields = keyof Fields> = Action<
	FormActionNames.Change,
	{ fields: Fields; fieldsChanged: BooleanFields<Fields>; name: K; newFieldValue: Fields[K] }
>;

/**
 * An action to indicate that someone is trying to submit the form. This action contains
 * the result of the submitted form and all the fields that have been changed in the process
 * of submitting this form
 */
export type FormSubmitAction<Fields, CollapsedModel> = Action<
	FormActionNames.Submit,
	{ fields: EitherObj<FormError[], CollapsedModel>; fieldsChanged: BooleanFields<Fields> }
>;

/**
 * A union of all the actions used by the form
 *
 * FormFieldsChangeAction has a default reducer implementation which can be used instead of
 * a custom reducer, but it is not necessarily something the user is responsible for
 *
 * FormSubmitAction does not have a reducer for it. This is an action that must be handled by
 * the user of this module
 */
export type FormAction<Fields, Collapsed> =
	| FormFieldsChangeAction<Fields>
	| FormSubmitAction<Fields, Collapsed>;

/**
 * Represents whether or not the form is enabled or disabled
 */
export enum EnabledState {
	Disabled = 'Disabled',
	Enabled = 'Enabled',
}

/**
 * Represents an input that is used by the form; e.g., a text input will have a
 * component with an input of type text and a collapse function that is the identity function
 */
export interface FormInput<
	InputModel,
	CollapsedFields,
	A extends Action<'InputChange', { name: string; newModel: InputModel }> = Action<
		'InputChange',
		{ name: string; newModel: InputModel }
	>
> {
	/**
	 * The component that should render and handle the input
	 *
	 * @param model the state of the model
	 * @param actionDispatch the dispatch method used to handle an input changed
	 *
	 * @returns a rendered component
	 */
	component: SubComponent<
		{
			value: InputModel;
			fullWidth: boolean;
			error: MaybeObj<FormError>;
			changed: boolean;
		},
		A
	>;
	/**
	 * Defines how the model can collapse into the collapsed type
	 *
	 * @param model the inner component model
	 *
	 * @returns the parsed state and its resulting type
	 */
	collapse: (model: InputModel) => EitherObj<FormError, CollapsedFields | undefined>;
	rowRenderer?: (formElement: React.ReactNode, label?: React.ReactNode) => React.ReactNode;
}

/**
 * Used to allow a user of this module to validate form inputs
 */
export type FormValidator<Fields extends {}> = {
	[P in keyof Fields]?: (field: Fields[P], otherFields: Fields) => EitherObj<FormError, any>;
};

/**
 * These are the different form options that help to configure a form that is being used
 */
export interface FormOptions<Fields extends {}, Collapsed = {}> {
	/**
	 * What text should show up in the submit button?
	 */
	submitButtonText?: string;
	/**
	 * What CSS class should be used for the submit button?
	 */
	submitButtonClassName?: string;
	/**
	 * Determines whether or not the row of the submit button should
	 * be rendered
	 */
	showSubmitButton?: boolean;

	/**
	 * Provides the CSS class name that is given to the form
	 */
	className?: string;

	/**
	 * Used to validate things that can't be validated at the type level;
	 * for instance, is the number inputted negative?
	 */
	validator?: FormValidator<Fields>;

	/**
	 * Used to create keys for the individual rows
	 *
	 * @param element the element of the row that is in need of a key
	 *
	 * @returns the key for the row
	 */
	keyFunction?: (element: RowElements<Fields>) => string;

	/**
	 * Whether or not the form should be disabled
	 *
	 * @param formFields used to determine whether or not the
	 * 	form should be disabled
	 *
	 * @returns the enabled state for the form
	 */
	disableForm?: (formFields: Fields) => EnabledState;

	/**
	 * Used to render each of the individual rows
	 *
	 * @param key the key of the row
	 * @param formElement the element that is used to render a node
	 * @param label? the label that is assigned to the input in this row
	 *
	 * @returns the formatted row
	 */
	rowRenderer?: (
		key: string,
		formElement: React.ReactNode,
		label?: React.ReactNode,
	) => React.ReactNode;

	/**
	 * Renders a title given the string
	 *
	 * @param title the title of the entire row
	 *
	 * @returns a rendered title
	 */
	titleRenderer?: (title: string) => React.ReactNode;

	/**
	 * Similar to the collapse method for a form input, this just operates on a
	 * larger scale
	 *
	 * @param fields the form fields to collapse
	 *
	 * @returns the collapsed form model
	 */
	collapse?: (fields: Fields) => EitherObj<FormError[], Collapsed>;
}

/**
 * Shows how a form is defined given some fields
 */
export type FormDefinition<Fields extends {}, Collapsed = {}> = {
	[P in keyof Fields]: {
		/**
		 * The label assigned to an input
		 */
		label?: React.ReactNode;

		/**
		 * Whether or not the input should take up the entire row
		 */
		fullWidth?: boolean;

		/**
		 * The error message to render in the case of this input being invalid
		 */
		errorMessage?: string;

		/**
		 * The component that contains information on how to handle the form input
		 */
		component: FormInput<Fields[P], P extends keyof Collapsed ? Collapsed[P] : any>;
	};
};

/**
 * Represents a reference to a form input that exists
 */
export interface FieldReference<Fields extends {}> {
	/**
	 * Descriminant
	 */
	type: 'Field';

	/**
	 * The form input that is being referenced
	 */
	fieldName: keyof Fields;
}

/**
 * Renders a title, given the title renderer in the options
 */
export interface Title {
	/**
	 * Descriminant
	 */
	type: 'Title';

	/**
	 * The title to render
	 */
	title: string;
}

/**
 * Renders a row that is not controlled by this form
 *
 * Useful for things like custom buttons to modify the form
 */
export interface CustomRow {
	/**
	 * Descriminant
	 */
	type: 'Row';

	/**
	 * The key used for performance
	 */
	key: string;
	/**
	 * The actual row to render
	 */
	row: React.ReactNode;
}

/**
 * Used to define the ordering and display of a form
 */
export type RowElements<Fields extends {}> = FieldReference<Fields> | Title | CustomRow;

/**
 * Defines the state of a form
 *
 * @template Fields
 * @param {Fields} fields the fields used in the form
 */
export interface FormModel<Fields extends {}> {
	/**
	 * Text used to render the submit button
	 */
	submitButtonText?: string;
	/**
	 * The CSS class assigned to the submit button
	 */
	submitButtonClass?: string;

	/**
	 * Whether or not the submit button should be disabled
	 */
	disabled: EnabledState;

	/**
	 * The ordering of the elements to render as well as the
	 * elements such as titles and custom elements
	 */
	rowElements: Array<RowElements<Fields>>;

	/**
	 * Which of the fields in the form have been changed
	 */
	fieldsChanged: {
		[P in keyof Fields]: boolean;
	};
	/**
	 * The state of the form inputs
	 */
	fieldsModels: Fields;
}

/**
 * Disables the form when an input is invalid according to the form
 * validator
 *
 * @param validator the validator for the form
 * @param fields the fields of the form to validate
 *
 * @return whether or not the form should be disabled as a result
 */
export const disableFormSubmitOnFieldsError = <Fields extends {}>(
	validator: FormValidator<Fields>,
) => (fields: Fields): EnabledState => {
	for (const key in fields) {
		if (fields.hasOwnProperty(key)) {
			if (validator[key] && Either.isLeft(validator[key]!(fields[key], fields))) {
				return EnabledState.Disabled;
			}
		}
	}

	return EnabledState.Enabled;
};

/**
 * Creates an empty change map for a list of fields
 *
 * @param fields the populated form to create a empty changed map
 *
 * @returns the empty change map
 */
export const createEmptyFieldsChangedObject = <Fields extends {}>(
	fields: Fields,
): BooleanFields<Fields> => {
	const returnValue = {} as BooleanFields<Fields>;

	for (const key in fields) {
		if (fields.hasOwnProperty(key)) {
			returnValue[key] = false;
		}
	}

	return returnValue;
};

/**
 * Default reducer for handling a change action
 *
 * @param model the previous form model
 * @param action the form change action
 *
 * @returns the new form model
 */
export const formModelFromChangeAction = <Fields extends {}>(
	model: FormModel<Fields>,
	action: FormFieldsChangeAction<Fields>,
): FormModel<Fields> => ({
	...model,

	fieldsChanged: {
		...model.fieldsChanged,
		[action.payload.name]: true,
	},
	fieldsModels: {
		...action.payload.fields,
		[action.payload.name]: action.payload.newFieldValue,
	},
});

/**
 * Used to render each of the individual rows
 *
 * @param key the key of the row
 * @param formElement the element that is used to render a node
 * @param label? the label that is assigned to the input in this row
 *
 * @returns the formatted row
 */
const defaultRowRenderer = (
	key: string,
	formElement: React.ReactNode,
	label?: React.ReactNode,
): React.ReactNode => (
	<div className="formbar" key={key}>
		<div className="label-formbox">{label}</div>
		<div className="input-formbox">{formElement}</div>
	</div>
);

const fullWidthStyles = { width: '100%', boxSizing: 'border-box', gridColumn: '1 / 3' } as const;

/**
 * Renders a title given the string
 *
 * @param title the title of the entire row
 *
 * @returns a rendered title
 */
const defaultTitleRenderer = (title: string): React.ReactNode => (
	<div className="form-header" style={fullWidthStyles}>
		<h3
			id={title
				.toLocaleLowerCase()
				.replace(/ _/g, '-')
				.replace(/\//g, '-')}
		>
			{title}
		</h3>
	</div>
);

/**
 * This is the default collapse method for taking a model, validator, and a definition
 * and collapses it into the desired state
 *
 * @template Fields
 * @template Collapsed
 *
 * @param formDefinition the form inputs of a form
 * @param validator the validator that is used to check if each field is valid
 * @param fields the fields of the form
 *
 * @returns {EitherObj<FormError[], Collapsed>} the collapsed state, wrapped in an Either object
 */
const getDefaultCollapseFunction = <
	Fields extends {},
	Collapsed extends { [P in keyof Fields]?: any }
>(
	formDefinition: FormDefinition<Fields, Collapsed>,
	validator: FormValidator<Fields>,
) => (fields: Fields): EitherObj<FormError[], Collapsed> => {
	const errors = [];
	const result = {} as Collapsed;

	for (const key in fields) {
		if (fields.hasOwnProperty(key)) {
			const collapseResult = formDefinition[key].component.collapse(fields[key]);

			if (Either.isLeft(collapseResult)) {
				errors.push(collapseResult.value);
			} else {
				if (validator[key]) {
					const validatorResult = validator[key]!(fields[key], fields);

					if (Either.isLeft(validatorResult)) {
						errors.push(validatorResult.value);
					} else {
						if (collapseResult.value !== undefined) {
							result[key] = collapseResult.value;
						}
					}
				} else {
					if (collapseResult.value !== undefined) {
						result[key] = collapseResult.value;
					}
				}
			}
		}
	}

	return errors.length === 0 ? Either.right(result) : Either.left(errors);
};

/**
 * Used to create keys for the individual rows
 *
 * @param element the element of the row that is in need of a key
 *
 * @returns the key for the row
 */
const defaultKeyFunction = <Fields extends {}>(rowElement: RowElements<Fields>): string =>
	rowElement.type === 'Title'
		? rowElement.title
		: rowElement.type === 'Field'
		? (rowElement.fieldName as string)
		: rowElement.key;

const clearFix: React.CSSProperties = {
	clear: 'both',
};

/**
 * Creates a form with the fields provided
 *
 * @template Fields the fields in the form
 * @template Collapsed the target object type for the form
 *
 * @param items the definition of the form. provides item information
 * @param settings defines optional settings, such as for overriding renderers
 * @param model the state of the form
 * @param dispatch the function to handle actions
 *
 * @returns a rendered form
 */
export const createForm = <Fields, Collapsed>(
	items: FormDefinition<Fields, Collapsed>,
	settings?: FormOptions<Fields, Collapsed>,
): SubComponent<FormModel<Fields>, FormAction<Fields, Collapsed>> => (model, dispatch) => {
	// Gets typed actions for this form
	// Really, since TypeScript types are erased, this doesn't do anything except appease TypeScript
	const changeAction = getChangeActionProducer<Fields>();
	const submitAction = getSubmitActionProducer<Fields, Collapsed>();

	// Sets up options given defaults
	const submitButtonText = model.submitButtonText ?? settings?.submitButtonText ?? 'Submit';
	const submitButtonClass = model.submitButtonClass ?? settings?.submitButtonClassName ?? '';
	const showSubmitButton = settings?.showSubmitButton ?? true;

	const submitRowRenderer = settings?.rowRenderer ?? defaultRowRenderer;
	const titleRenderer = settings?.titleRenderer ?? defaultTitleRenderer;
	const keyFunction = settings?.keyFunction ?? defaultKeyFunction;

	const collapseFunction =
		settings?.collapse ?? getDefaultCollapseFunction(items, settings?.validator ?? {});

	const formStateFromFieldsFunction =
		settings?.disableForm ?? disableFormSubmitOnFieldsError(settings?.validator ?? {});

	const formDisabled =
		model.disabled === EnabledState.Disabled ||
		formStateFromFieldsFunction(model.fieldsModels) === EnabledState.Disabled;

	// Quick handler for form submit
	const onFormSubmit = () => {
		const result = collapseFunction(model.fieldsModels);

		dispatch(submitAction(result, model.fieldsChanged));
	};

	// Decides how to render each element of a row and ensures it is properly rendered
	const renderRowElement = (rowElement: RowElements<Fields>): React.ReactNode => {
		const key = keyFunction(rowElement);

		switch (rowElement.type) {
			case 'Title':
				return <React.Fragment key={key}>{titleRenderer(rowElement.title)}</React.Fragment>;

			case 'Row':
				return <React.Fragment key={key}>{rowElement.row}</React.Fragment>;

			case 'Field': {
				const fieldDefinition = items[rowElement.fieldName];

				if (!fieldDefinition) {
					return null;
				}

				const rowRenderer =
					settings?.rowRenderer ??
					fieldDefinition.component.rowRenderer ??
					defaultRowRenderer;

				const error = Either.cata<FormError, void, MaybeObj<FormError>>(Maybe.some)(
					Maybe.none,
				)(
					settings?.validator?.[rowElement.fieldName]?.(
						model.fieldsModels[rowElement.fieldName],
						model.fieldsModels,
					) ?? Either.right(void 0),
				);

				return rowRenderer(
					key,
					fieldDefinition.component.component(
						{
							value: model.fieldsModels[rowElement.fieldName],
							error,
							changed: model.fieldsChanged[rowElement.fieldName],
							fullWidth: fieldDefinition.fullWidth ?? false,
						},
						({ payload: { name, newModel } }) =>
							dispatch(
								changeAction(
									model.fieldsModels,
									model.fieldsChanged,
									name,
									newModel,
								),
							),
					),
					fieldDefinition.label,
				);
			}
		}
	};

	// Bringing it all together with the options set above
	return (
		<form className={settings?.className}>
			{model.rowElements.map(renderRowElement)}

			{showSubmitButton &&
				submitRowRenderer(
					'form-submit-row',
					<input
						type="submit"
						value={submitButtonText}
						disabled={formDisabled}
						className={`primaryButton ${submitButtonClass}`}
						onClick={onFormSubmit}
					/>,
				)}

			<div style={clearFix} />
		</form>
	);
};
