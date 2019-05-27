import { EditorState } from 'draft-js';

let draft: typeof import('draft-js') | null = null;

interface Returns {
	state: EditorState;
	creator: typeof EditorState.createWithContent;
}

const queue: Array<(value: Returns) => void> = [];

import('draft-js').then(mod => {
	draft = mod;
	for (const i of queue) {
		i({
			state: mod.EditorState.createEmpty(),
			creator: mod.EditorState.createWithContent
		});
	}
});

export default (): Promise<Returns> => {
	if (draft !== null) {
		return Promise.resolve({
			state: draft.EditorState.createEmpty(),
			creator: draft.EditorState.createWithContent
		});
	} else {
		return new Promise<Returns>(res => {
			queue.push(res);
		});
	}
};
