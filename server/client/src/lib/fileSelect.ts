import selector from './selector';
import { FileObject } from '../../../src/types';
import { DialogueAction } from '../actions/dialogue';

export default (
	displayDialogue: (data: DialogueAction) => void,
	multiple: boolean = true,
	photosOnly: boolean = false
): Promise<(number | string)[]> => {
	return selector<FileObject>(
		displayDialogue,
		'/api/files',
		'Select files',
		multiple,
		obj => `${obj.name} (${parseInt((obj.size / 1024) + '', 10)}KB)`,
		obj => photosOnly ? obj.isPhoto : true,
		true
	);
};