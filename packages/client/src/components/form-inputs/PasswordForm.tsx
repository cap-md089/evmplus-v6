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

import React from 'react';
import { InputProps } from './Input';
import { FormBlock, TextBox, Label, TextInput } from '../forms/SimpleForm';
import { passwordMeetsRequirements } from 'common-lib';
import { BooleanForField } from './FormBlock';
import './PasswordForm.css';

enum ShowLevel {
	NOSHOW = -1,
	SHOWERROR = 0,
	SHOWGOOD = 1,
}

const getClassFromShowLevel = (level: ShowLevel): string =>
	level === ShowLevel.SHOWERROR
		? 'password-item-bad'
		: level === ShowLevel.SHOWGOOD
		? 'password-item-good'
		: '';

interface PasswordFormValues {
	password: string;
	confirmPassword: string;
}

interface PasswordFormState {
	form: PasswordFormValues;

	showUppercaseError: ShowLevel;
	showLowercaseError: ShowLevel;
	showNumberError: ShowLevel;
	showSpecialError: ShowLevel;
	showMatchError: ShowLevel;
	showLengthError: ShowLevel;
}

const passwordValidator = (password: string, others: PasswordFormValues): boolean =>
	!!password && passwordMeetsRequirements(password) && others.password === others.confirmPassword;

const formValidator = {
	password: passwordValidator,
	confirmPassword: passwordValidator,
};

/**
 * A password form
 *
 * Returns null if passwords are invalid in any way
 */
export default class PasswordForm extends React.Component<
	InputProps<string | null>,
	PasswordFormState
> {
	public state: PasswordFormState = {
		form: {
			confirmPassword: '',
			password: '',
		},
		showLowercaseError: 0,
		showMatchError: 0,
		showNumberError: 0,
		showSpecialError: 0,
		showUppercaseError: 0,
		showLengthError: 0,
	};

	public constructor(props: InputProps<string | null>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.onInitialize) {
			props.onInitialize({
				name: this.props.name,
				value: null,
			});
		}
	}

	public render = (): JSX.Element => (
		<FormBlock<PasswordFormValues>
			name={this.props.name}
			value={this.state.form}
			onFormChange={this.onChange}
			validator={formValidator}
		>
			<Label />
			<TextBox>
				Please enter and confirm a password.
				<br />
				Passwords must meet the following requirements:
				<ul>
					<li className={getClassFromShowLevel(this.state.showLengthError)}>
						Length of at least 8 characters
					</li>
					<li
						className={getClassFromShowLevel(
							this.state.showUppercaseError &&
								this.state.showLowercaseError &&
								this.state.showNumberError &&
								this.state.showSpecialError,
						)}
					>
						<span>Password must contain one of each of the following characters:</span>
						<ul>
							<li className={getClassFromShowLevel(this.state.showUppercaseError)}>
								Uppercase character
							</li>
							<li className={getClassFromShowLevel(this.state.showLowercaseError)}>
								Lowercase character
							</li>
							<li className={getClassFromShowLevel(this.state.showNumberError)}>
								Number
							</li>
							<li className={getClassFromShowLevel(this.state.showSpecialError)}>
								Special character*
							</li>
						</ul>
					</li>
				</ul>
				* A special character is a space character or one of the following symbols:
				<br />^ ! @ # $ % ^ &amp; * ( ) {'{'} {'}'} _ + - = {'<'} {'>'} , . ? / [ ] \ | ; '
				"
				<br />
				<span className={getClassFromShowLevel(this.state.showMatchError)}>
					Passwords must also match
				</span>
			</TextBox>

			<Label>Enter password</Label>
			<TextInput name="password" password={true} />

			<Label>Confirm password</Label>
			<TextInput name="confirmPassword" password={true} />
		</FormBlock>
	);

	private onChange = (
		fields: PasswordFormValues,
		error: BooleanForField<PasswordFormValues>,
		changed: BooleanForField<PasswordFormValues>,
	): void => {
		const hasChanged = changed.confirmPassword || changed.password;

		this.setState({
			form: fields,
		});

		if (!hasChanged) {
			return;
		}

		let hasError = false;

		const update: Omit<PasswordFormState, 'form'> = {
			showLowercaseError: ShowLevel.SHOWERROR,
			showNumberError: ShowLevel.SHOWERROR,
			showSpecialError: ShowLevel.SHOWERROR,
			showUppercaseError: ShowLevel.SHOWERROR,
			showMatchError: ShowLevel.SHOWERROR,
			showLengthError: ShowLevel.SHOWERROR,
		};

		if (!!/[a-z]/.exec(fields.password) && !!/[a-z]/.exec(fields.confirmPassword)) {
			update.showLowercaseError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (!!/[A-Z]/.exec(fields.password) && !!/[A-Z]/.exec(fields.confirmPassword)) {
			update.showUppercaseError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (!!/[0-9]/.exec(fields.password) && !!/[0-9]/.exec(fields.confirmPassword)) {
			update.showNumberError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (
			!!/[ ^!@#$%&*(){}+=_\-<>,.?/[\]\\|;'"]/.exec(fields.password) &&
			!!/[ ^!@#$%&*(){}+=_\-<>,.?/[\]\\|;'"]/.exec(fields.confirmPassword)
		) {
			update.showSpecialError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (fields.password === fields.confirmPassword) {
			update.showMatchError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (fields.password.length >= 8) {
			update.showLengthError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		this.setState(prev => ({
			...prev,
			...update,
		}));

		if (hasError) {
			if (this.props.onChange) {
				this.props.onChange(null);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: null,
				});
			}
		} else {
			if (this.props.onChange) {
				this.props.onChange(fields.password);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: fields.password,
				});
			}
		}
	};
}
