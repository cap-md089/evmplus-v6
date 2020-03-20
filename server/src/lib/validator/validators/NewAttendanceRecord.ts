import {
	AttendanceStatus,
	CustomAttendanceFieldCheckboxValue,
	CustomAttendanceFieldDateValue,
	CustomAttendanceFieldEntryType,
	CustomAttendanceFieldFileValue,
	CustomAttendanceFieldNumberValue,
	CustomAttendanceFieldTextValue,
	NewAttendanceRecord
} from 'common-lib';
import Validator from '../Validator';

export const CustomAttendanceFieldCheckboxValueValidator = new Validator<
	CustomAttendanceFieldCheckboxValue
>({
	title: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue(CustomAttendanceFieldEntryType.CHECKBOX)
	},
	value: {
		validator: Validator.Boolean
	}
});

export const CustomAttendanceFieldDateValueValidator = new Validator<
	CustomAttendanceFieldDateValue
>({
	title: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue(CustomAttendanceFieldEntryType.DATE)
	},
	value: {
		validator: Validator.Number
	}
});

export const CustomAttendanceFieldNumberValueValidator = new Validator<
	CustomAttendanceFieldNumberValue
>({
	title: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue(CustomAttendanceFieldEntryType.NUMBER)
	},
	value: {
		validator: Validator.Number
	}
});

export const CustomAttendanceFieldFileValueValidator = new Validator<
	CustomAttendanceFieldFileValue
>({
	title: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue(CustomAttendanceFieldEntryType.FILE)
	},
	value: {
		validator: Validator.ArrayOf(Validator.String)
	}
});

export const CustomAttendanceFieldTextValueValidator = new Validator<
	CustomAttendanceFieldTextValue
>({
	title: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue(CustomAttendanceFieldEntryType.TEXT)
	},
	value: {
		validator: Validator.String
	}
});

export default class NewAttendanceRecordValidator extends Validator<NewAttendanceRecord> {
	constructor() {
		super({
			comments: {
				validator: Validator.String
			},
			planToUseCAPTransportation: {
				validator: Validator.Boolean
			},
			status: {
				validator: Validator.Enum(AttendanceStatus)
			},
			memberID: {
				required: false,
				validator: Validator.MemberReference
			},

			arrivalTime: {
				validator: Validator.Number,
				requiredIf: (value: number | null, obj: NewAttendanceRecord) => {
					return obj.departureTime !== null;
				}
			},
			departureTime: {
				validator: Validator.Number,
				requiredIf: (value: number | null, obj: NewAttendanceRecord) => {
					return obj.arrivalTime !== null;
				}
			},
			customAttendanceFieldValues: {
				validator: Validator.ArrayOf(
					Validator.Or(
						CustomAttendanceFieldCheckboxValueValidator,
						CustomAttendanceFieldDateValueValidator,
						CustomAttendanceFieldFileValueValidator,
						CustomAttendanceFieldNumberValueValidator,
						CustomAttendanceFieldTextValueValidator
					)
				)
			}
		});
	}
}
