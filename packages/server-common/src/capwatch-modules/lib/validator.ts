import { ValidateRuleSet, Validator } from 'common-lib';

export type FileData<T> = {
	[P in keyof T]: string;
};

export const convertCAPWATCHValidator = <T extends object>(
	validator: Validator<T>,
): Validator<FileData<T>> => {
	const newRules = {} as ValidateRuleSet<FileData<T>>;

	for (const ruleName in validator.rules) {
		if (validator.rules.hasOwnProperty(ruleName)) {
			newRules[ruleName] = Validator.String;
		}
	}

	return new Validator(newRules);
};
