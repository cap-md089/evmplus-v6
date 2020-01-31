import { Errors } from '../typings/types';

export const areErrorObjectsTheSame = (err1: Errors) => (err2: Errors): boolean =>
	err1.type === err2.type &&
	err1.message === err2.message &&
	err1.stack[0].filename === err2.stack[0].filename &&
	err1.stack[0].line === err2.stack[0].line &&
	err1.stack[0].column === err2.stack[0].column;
