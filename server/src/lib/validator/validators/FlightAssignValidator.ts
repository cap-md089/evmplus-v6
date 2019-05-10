import { MemberReference } from 'common-lib';
import Validator from '../Validator';

export interface FlightAssign {
	member: MemberReference;
	newFlight: string | null;
}

export default new Validator<FlightAssign>({
	member: {
		validator: Validator.MemberReference
	},
	newFlight: {
		required: false,
		validator: Validator.Or(Validator.String, Validator.Null)
	}
});
