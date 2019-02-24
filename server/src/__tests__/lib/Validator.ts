import Validator from "../../lib/validator/Validator";

interface BasicType {
	thing: string;
}

interface OptionalThing {
	thing?: string;
}

interface OptionalThing {
	thing?: string;
}

describe ('Validator', () => {
	it('should validate basic properties', () => {
		const basicValidator = new Validator<BasicType>({
			thing: {
				validator: Validator.String,
				required: true
			}
		});

		expect(basicValidator.validate({thing: 'string'})).toEqual(true);
		expect(basicValidator.validate({nothing: 1})).toEqual(false);
	});

	it('should validate optional parameters', () => {
		const optionalValidator = new Validator<OptionalThing>({
			thing: {
				validator: Validator.String,
				required: false
			}
		});

		expect(optionalValidator.validate({thing: 'string'})).toEqual(true);
		expect(optionalValidator.validate({})).toEqual(true);
		expect(optionalValidator.validate({thing: 1})).toEqual(false);
	});
});