import { EditorState } from 'draft-js';

let draft: typeof import('draft-js') | null = null;

const queue: Array<(state: EditorState) => void> = [];

import('draft-js').then(mod => {
	draft = mod;
	for (const i of queue) {
		i(mod.EditorState.createEmpty());
	}
});

export default (): Promise<EditorState> => {
	if (draft !== null) {
		return Promise.resolve(draft.EditorState.createEmpty());
	} else {
		return new Promise<EditorState>(res => {
			queue.push(res);
		});
	}
}

export { EditorState };