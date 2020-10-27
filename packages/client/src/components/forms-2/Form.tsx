export type FormItem = null;

export interface FormOptions {}

export const createForm = <FormDefinition extends { [key: string]: FormItem }>(
	settings: FormOptions,
	items: FormDefinition,
) => void 0;
