import {
	CustomAttendanceField,
	CustomAttendanceFieldEntryType,
	EchelonEventNumber,
	EventStatus,
	ExternalPointOfContact,
	InternalPointOfContact,
	NewEventObject,
	PointOfContactType
} from 'common-lib';
import Validator from '../Validator';

class ParticipationFeeValidator extends Validator<{
	feeDue: number;
	feeAmount: number;
}> {
	constructor() {
		super({
			feeAmount: {
				validator: Validator.Number
			},
			feeDue: {
				validator: Validator.Number
			}
		});
	}
}

class RegistrationValidator extends Validator<{
	deadline: number;
	information: string;
}> {
	constructor() {
		super({
			deadline: {
				validator: Validator.Number
			},
			information: {
				validator: Validator.String
			}
		});
	}
}

class InternalPOCValidator extends Validator<InternalPointOfContact> {
	constructor() {
		super({
			memberReference: {
				validator: Validator.MemberReference
			},
			email: {
				validator: Validator.String,
				required: false
			},
			phone: {
				validator: Validator.String,
				required: false
			},
			receiveEventUpdates: {
				validator: Validator.Boolean
			},
			receiveRoster: {
				validator: Validator.Boolean
			},
			receiveSignUpUpdates: {
				validator: Validator.Boolean
			},
			receiveUpdates: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(PointOfContactType.INTERNAL)
			}
		});
	}
}

class ExternalPOCValidator extends Validator<ExternalPointOfContact> {
	constructor() {
		super({
			email: {
				validator: Validator.String,
				required: false
			},
			name: {
				validator: Validator.String
			},
			phone: {
				validator: Validator.String,
				required: false
			},
			receiveEventUpdates: {
				validator: Validator.Boolean
			},
			receiveRoster: {
				validator: Validator.Boolean
			},
			receiveSignUpUpdates: {
				validator: Validator.Boolean
			},
			receiveUpdates: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(PointOfContactType.EXTERNAL)
			}
		});
	}
}

class CustomAttendanceFieldCheckboxValidator extends Validator<CustomAttendanceField> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			preFill: {
				validator: Validator.Boolean
			},
			displayToMember: {
				validator: Validator.Boolean
			},
			allowMemberToModify: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(CustomAttendanceFieldEntryType.CHECKBOX)
			}
		});
	}
}

class CustomAttendanceFieldDateValidator extends Validator<CustomAttendanceField> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			preFill: {
				validator: Validator.Number
			},
			displayToMember: {
				validator: Validator.Boolean
			},
			allowMemberToModify: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(CustomAttendanceFieldEntryType.DATE)
			}
		});
	}
}

class CustomAttendanceFieldFileValidator extends Validator<CustomAttendanceField> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			preFill: {
				validator: Validator.String
			},
			displayToMember: {
				validator: Validator.Boolean
			},
			allowMemberToModify: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(CustomAttendanceFieldEntryType.FILE)
			}
		});
	}
}

class CustomAttendanceFieldNumberValidator extends Validator<CustomAttendanceField> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			preFill: {
				validator: Validator.Number
			},
			displayToMember: {
				validator: Validator.Boolean
			},
			allowMemberToModify: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(CustomAttendanceFieldEntryType.NUMBER)
			}
		});
	}
}

class CustomAttendanceFieldTextValidator extends Validator<CustomAttendanceField> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			preFill: {
				validator: Validator.String
			},
			displayToMember: {
				validator: Validator.Boolean
			},
			allowMemberToModify: {
				validator: Validator.Boolean
			},
			type: {
				validator: Validator.StrictValue(CustomAttendanceFieldEntryType.TEXT)
			}
		});
	}
}

export default class EventValidator extends Validator<NewEventObject> {
	constructor() {
		super({
			acceptSignups: {
				validator: Validator.Boolean
			},
			activity: {
				validator: Validator.OtherMultCheckboxReturn
			},
			administrationComments: {
				validator: Validator.String
			},
			comments: {
				validator: Validator.String
			},
			complete: {
				validator: Validator.Boolean
			},
			desiredNumberOfParticipants: {
				validator: Validator.Number
			},
			endDateTime: {
				validator: Validator.Number
			},
			eventWebsite: {
				validator: Validator.String
			},
			fileIDs: {
				validator: Validator.ArrayOf(Validator.String)
			},
			groupEventNumber: {
				validator: Validator.OtherRadioReturn(EchelonEventNumber)
			},
			highAdventureDescription: {
				validator: Validator.String
			},
			location: {
				validator: Validator.String
			},
			lodgingArrangments: {
				validator: Validator.OtherMultCheckboxReturn
			},
			mealsDescription: {
				validator: Validator.OtherMultCheckboxReturn
			},
			meetDateTime: {
				validator: Validator.Number
			},
			meetLocation: {
				validator: Validator.String
			},
			name: {
				validator: Validator.String
			},
			participationFee: {
				validator: Validator.Or(new ParticipationFeeValidator(), Validator.Null),
				required: false
			},
			pickupDateTime: {
				validator: Validator.Number
			},
			pickupLocation: {
				validator: Validator.String
			},
			pointsOfContact: {
				validator: Validator.ArrayOf(
					Validator.Or(new InternalPOCValidator(), new ExternalPOCValidator())
				)
			},
			customAttendanceFields: {
				validator: Validator.ArrayOf(
					Validator.Or(
						new CustomAttendanceFieldCheckboxValidator(),
						new CustomAttendanceFieldDateValidator(),
						new CustomAttendanceFieldFileValidator(),
						new CustomAttendanceFieldNumberValidator(),
						new CustomAttendanceFieldTextValidator()
					)
				)
			},
			publishToWingCalendar: {
				validator: Validator.Boolean
			},
			regionEventNumber: {
				validator: Validator.OtherRadioReturn(EchelonEventNumber)
			},
			registration: {
				validator: Validator.Or(new RegistrationValidator(), Validator.Null),
				required: false
			},
			requiredEquipment: {
				validator: Validator.ArrayOf(Validator.String)
			},
			requiredForms: {
				validator: Validator.OtherMultCheckboxReturn
			},
			showUpcoming: {
				validator: Validator.Boolean
			},
			signUpDenyMessage: {
				validator: Validator.String,
				requiredIf: (_, event) => {
					return (
						typeof (event as any).acceptSignups === 'boolean' && !event.acceptSignups
					);
				}
			},
			signUpPartTime: {
				validator: Validator.Boolean
			},
			startDateTime: {
				validator: Validator.Number
			},
			status: {
				validator: Validator.Enum(EventStatus)
			},
			teamID: {
				validator: Validator.Or(Validator.Number, Validator.Null)
			},
			limitSignupsToTeam: {
				validator: Validator.Or(Validator.Boolean, Validator.Null),
				requiredIf: (_, event) => {
					return typeof (event as any).teamID === 'number';
				}
			},
			transportationDescription: {
				validator: Validator.String
			},
			transportationProvided: {
				validator: Validator.Boolean
			},
			uniform: {
				validator: Validator.OtherMultCheckboxReturn
			},
			wingEventNumber: {
				validator: Validator.OtherRadioReturn(EchelonEventNumber)
			},
			privateAttendance: {
				validator: Validator.Boolean
			}
		});
	}
}
