import React from 'react';
import { InputProps } from './Input';
import { FormBlock, TextBox, Label, TextInput } from '../forms/SimpleForm';
import { passwordMeetsRequirements } from 'common-lib';
import { BooleanForField } from './FormBlock';
import './PasswordForm.css';

enum ShowLevel {
	NOSHOW,
	SHOWERROR,
	SHOWGOOD
}

const getClassFromShowLevel = (level: ShowLevel) =>
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
}

const passwordValidator = (password: string, others: PasswordFormValues) =>
	!!password && passwordMeetsRequirements(password) && others.password === others.confirmPassword;

const formValidator = {
	password: passwordValidator,
	confirmPassword: passwordValidator
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
			password: ''
		},
		showLowercaseError: 0,
		showMatchError: 0,
		showNumberError: 0,
		showSpecialError: 0,
		showUppercaseError: 0
	};

	public constructor(props: InputProps<string | null>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (props.onInitialize) {
			props.onInitialize({
				name: this.props.name,
				value: null
			});
		}
	}

	public render() {
		return (
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
					Passwords must be greater than 10 characters in length, and must consist of at
					least one of each of the following:
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
					* A special character is a space character or one of the following symbols:
					<br />^ ! @ # $ % ^ &amp; * ( ) {'{'} {'}'} _ + - = {'<'} {'>'} , . ? / [ ] \ |
					; ' "
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
	}

	private onChange(
		fields: PasswordFormValues,
		error: BooleanForField<PasswordFormValues>,
		changed: BooleanForField<PasswordFormValues>
	) {
		const hasChanged = changed.confirmPassword || changed.password;

		this.setState({
			form: fields
		});

		if (!hasChanged) {
			return;
		}

		let hasError = false;

		const update: Partial<PasswordFormState> = {
			showLowercaseError: ShowLevel.SHOWERROR,
			showNumberError: ShowLevel.SHOWERROR,
			showSpecialError: ShowLevel.SHOWERROR,
			showUppercaseError: ShowLevel.SHOWERROR,
			showMatchError: ShowLevel.SHOWERROR
		};

		if (!!fields.password.match(/[a-z]/) && !!fields.confirmPassword.match(/[a-z]/)) {
			update.showLowercaseError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (!!fields.password.match(/[A-Z]/) && !!fields.confirmPassword.match(/[A-Z]/)) {
			update.showUppercaseError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (!!fields.password.match(/[0-9]/) && !!fields.confirmPassword.match(/[0-9]/)) {
			update.showNumberError = ShowLevel.SHOWGOOD;
		} else {
			hasError = true;
		}

		if (
			!!fields.password.match(/[ ^!@#$%&*(){}+=_\-<>,.?/[\]\\|;'"]/) &&
			!!fields.confirmPassword.match(/[ ^!@#$%&*(){}+=_\-<>,.?/[\]\\|;'"]/)
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

		this.setState(prev => ({
			...prev,
			...update
		}));

		if (hasError) {
			if (this.props.onChange) {
				this.props.onChange(null);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: null
				});
			}
		} else {
			if (this.props.onChange) {
				this.props.onChange(fields.password);
			}

			if (this.props.onUpdate) {
				this.props.onUpdate({
					name: this.props.name,
					value: fields.password
				});
			}
		}
	}
}
