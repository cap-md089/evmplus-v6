import {
	EchelonEventNumber,
	EventStatus,
	PointOfContactType
} from '../../../enums';
import Validator from '../Validator';

class ParticipationFeeValidator extends Validator<{
	feeDue: number;
	feeAmount: number;
}> {
	constructor() {
		super([
			{
				key: 'feeAmount',
				validator: Validator.Number
			},
			{
				key: 'feeDue',
				validator: Validator.Number
			}
		]);
	}
}

class RegistrationValidator extends Validator<{
	deadline: number;
	information: string;
}> {
	constructor() {
		super([
			{
				key: 'deadline',
				validator: Validator.Number
			},
			{
				key: 'information',
				validator: Validator.String
			}
		]);
	}
}

class InternalPOCValidator extends Validator<InternalPointOfContact> {
	constructor() {
		super([
			{
				key: 'memberReference',
				validator: Validator.MemberReference
			},
			{
				key: 'email',
				validator: Validator.String,
				required: false
			},
			{
				key: 'phone',
				validator: Validator.String,
				required: false
			},
			{
				key: 'receiveEventUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'receiveRoster',
				validator: Validator.Boolean
			},
			{
				key: 'receiveSignUpUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'receiveUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'type',
				validator: Validator.StrictValue(PointOfContactType.INTERNAL)
			}
		]);
	}
}

class ExternalPOCValidator extends Validator<ExternalPointOfContact> {
	constructor() {
		super([
			{
				key: 'email',
				validator: Validator.String,
				required: false
			},
			{
				key: 'name',
				validator: Validator.String
			},
			{
				key: 'phone',
				validator: Validator.String,
				required: false
			},
			{
				key: 'receiveEventUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'receiveRoster',
				validator: Validator.Boolean
			},
			{
				key: 'receiveSignUpUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'receiveUpdates',
				validator: Validator.Boolean
			},
			{
				key: 'type',
				validator: Validator.StrictValue(PointOfContactType.EXTERNAL)
			}
		]);
	}
}

export default class EventValidator extends Validator<NewEventObject> {
	constructor() {
		super([
			{
				key: 'acceptSignups',
				validator: Validator.Boolean
			},
			{
				key: 'activity',
				validator: Validator.CheckboxReturn
			},
			{
				key: 'administrationComments',
				validator: Validator.String
			},
			{
				key: 'comments',
				validator: Validator.String
			},
			{
				key: 'complete',
				validator: Validator.Boolean
			},
			{
				key: 'debrief',
				validator: Validator.String
			},
			{
				key: 'desiredNumberOfParticipants',
				validator: Validator.Number
			},
			{
				key: 'endDateTime',
				validator: Validator.Number
			},
			{
				key: 'eventWebsite',
				validator: Validator.String
			},
			{
				key: 'fileIDs',
				validator: Validator.ArrayOf(Validator.String)
			},
			{
				key: 'groupEventNumber',
				validator: Validator.RadioReturn(EchelonEventNumber)
			},
			{
				key: 'highAdventureDescription',
				validator: Validator.String
			},
			{
				key: 'location',
				validator: Validator.String
			},
			{
				key: 'lodgingArrangments',
				validator: Validator.CheckboxReturn
			},
			{
				key: 'mealsDescription',
				validator: Validator.CheckboxReturn
			},
			{
				key: 'meetDateTime',
				validator: Validator.Number
			},
			{
				key: 'meetLocation',
				validator: Validator.String
			},
			{
				key: 'name',
				validator: Validator.String
			},
			{
				key: 'participationFee',
				validator: new ParticipationFeeValidator(),
				required: false
			},
			{
				key: 'pickupDateTime',
				validator: Validator.Number
			},
			{
				key: 'pickupLocation',
				validator: Validator.String
			},
			{
				key: 'pointsOfContact',
				validator: Validator.ArrayOf(
					Validator.Or(
						new InternalPOCValidator(),
						new ExternalPOCValidator()
					)
				)
			},
			{
				key: 'publishToWingCalendar',
				validator: Validator.Boolean
			},
			{
				key: 'regionEventNumber',
				validator: Validator.RadioReturn(EchelonEventNumber)
			},
			{
				key: 'registration',
				validator: new RegistrationValidator(),
				required: false
			},
			{
				key: 'requiredEquipment',
				validator: Validator.ArrayOf(Validator.String)
			},
			{
				key: 'requiredForms',
				validator: Validator.CheckboxReturn
			},
			{
				key: 'showUpcoming',
				validator: Validator.Boolean
			},
			{
				key: 'signUpDenyMessage',
				validator: Validator.String
			},
			{
				key: 'signUpPartTime',
				validator: Validator.Boolean
			},
			{
				key: 'startDateTime',
				validator: Validator.Number
			},
			{
				key: 'status',
				validator: Validator.RadioReturn(EventStatus)
			},
			{
				key: 'teamID',
				validator: Validator.Or(Validator.Number, Validator.Nothing)
			},
			{
				key: 'transportationDescription',
				validator: Validator.String
			},
			{
				key: 'transportationProvided',
				validator: Validator.Boolean
			},
			{
				key: 'uniform',
				validator: Validator.CheckboxReturn
			},
			{
				key: 'wingEventNumber',
				validator: Validator.RadioReturn(EchelonEventNumber)
			}
		]);
	}
}
