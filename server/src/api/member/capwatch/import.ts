import { asyncErrorHandler } from "../../../lib/Util";
import { MemberValidatedRequest } from "../../../lib/validator/Validator";

export default asyncErrorHandler(async (req: MemberValidatedRequest<{ orgids: string[] }>, res) => {

});