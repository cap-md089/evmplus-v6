import { Response } from "express";
import { MemberRequest } from "../../lib/MemberBase";
import Registry from "../../lib/Registry";
import { asyncErrorHandler, getFullSchemaValidator } from "../../lib/Util";

const registryValidator = getFullSchemaValidator('RegistryValues.json');

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	let registry: Registry;

	if (!registryValidator(req.body)) {
		res.status(400);
		res.end();
		return;
	}

	if (!req.member.hasPermission('RegistryEdit')) {
		res.status(403);
		res.end();
		return;
	}

	try {
		registry = await Registry.Get(req.account, req.mysqlx);
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	registry.set(req.body);

	res.status(204);
	res.end();
})