import selector from './selector';
import { MemberObject } from '../../../src/types';
import { DialogueAction } from '../actions/dialogue';

export default (
	displayDialogue: (data: DialogueAction) => void,
	multiple: boolean = true,
): Promise<(number | string)[]> => {
	return selector<MemberObject>(
		displayDialogue,
		'/api/member',
		'Select files',
		multiple,
		obj => `${obj.memberRank} ${obj.nameFirst} ${obj.nameLast}`,
		obj => true,
		true
	);
};