import { render } from '@testing-library/react';
import { Maybe } from 'common-lib';
import { createTextInput } from '../../../../components/form-inputs-2/TextInput';

describe('form inputs', () => {
	describe('text input', () => {
		it('should render a text input with default options', () => {
			const inputName = 'basic input';

			const { container } = render(
				createTextInput(inputName).component(
					{ changed: false, error: Maybe.none(), value: '' },
					() => void 0,
				),
			);

			const input = container.getElementsByTagName('input')[0];

			expect(input).not.toBeFalsy();
			expect(input.name).toEqual(inputName);
		});
	});
});
