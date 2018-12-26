import { AttendanceStatus } from "../../../enums";
import Validator from "../Validator";

export default class NewAttendanceRecordValidator extends Validator<NewAttendanceRecord> {
	constructor() {
		super({
			comments: {
				validator: Validator.String
			},
			planToUseCAPTransportation: {
				validator: Validator.Boolean
			},
			requirements: {
				validator: Validator.String
			},
			status: {
				validator: Validator.Enum(AttendanceStatus)
			},

			canUsePhotos: {
				validator: Validator.Boolean
			},

			memberID: {
				required: false,
				validator: Validator.MemberReference,
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
			}
		})
	}
}