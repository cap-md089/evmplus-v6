import { MemberReference } from 'common-lib';
import Validator from '../Validator';

export interface FlightAssign {
	member: MemberReference;
	newFlight: string;
}

export default new Validator<FlightAssign>({
	member: {
		validator: Validator.MemberReference
	},
	newFlight: {
		validator: Validator.String
	}
});
