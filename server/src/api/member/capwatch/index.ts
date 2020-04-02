import { MemberUpdateEventEmitter } from 'common-lib';
import { Router } from 'express';
import _import from './import';

export default (emitter: MemberUpdateEventEmitter) => {
	const router = Router();

	router.post(
		'/import',
		// import is a reserved JS keyword :/
		_import(emitter)
	);

	return router;
};
