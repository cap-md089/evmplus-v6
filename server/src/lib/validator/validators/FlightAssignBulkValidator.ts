import Validator from '../Validator';
import FlightAssignValidator, { FlightAssign } from './FlightAssignValidator';

export interface FlightAssignBulk {
	members: FlightAssign[];
}

export default new Validator<FlightAssignBulk>({
	members: {
		validator: Validator.ArrayOf(FlightAssignValidator)
	}
});
