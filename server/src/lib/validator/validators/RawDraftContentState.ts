import { Draft, RawDraftContentState } from 'common-lib';
import Validator from '../Validator';

class RawDraftEntityValidator extends Validator<Draft.RawDraftEntity> {
	constructor() {
		super({
			data: {
				validator: Validator.Anything
			},
			mutability: {
				validator: Validator.Or(
					Validator.StrictValue('MUTABLE'),
					Validator.StrictValue('IMMUTABLE'),
					Validator.StrictValue('SEGMENTED')
				)
			},
			type: {
				validator: Validator.OneOfStrict(
					'LINK',
					'TOKEN',
					'PHOTO',
					'IMAGE'
				)
			}
		});
	}
}

class RawDraftEntityRangeValidator extends Validator<Draft.RawDraftEntityRange> {
	constructor() {
		super({
			key: {
				validator: Validator.Number
			},
			offset: {
				validator: Validator.Number
			},
			length: {
				validator: Validator.Number
			}
		});
	}
}

class RawDraftInlineStyleRangeValidator extends Validator<
	Draft.RawDraftInlineStyleRange
> {
	constructor() {
		super({
			style: {
				validator: Validator.OneOfStrict<Draft.DraftInlineStyleType>(
					'BOLD',
					'CODE',
					'ITALIC',
					'STRIKETHROUGH',
					'UNDERLINE'
				)
			},
			offset: {
				validator: Validator.Number
			},
			length: {
				validator: Validator.Number
			}
		});
	}
}

class RawDraftContentBlockValidator extends Validator<Draft.RawDraftContentBlock> {
	constructor() {
		super({
			data: {
				validator: Validator.Anything,
				required: false
			},
			depth: {
				validator: Validator.Number
			},
			entityRanges: {
				validator: Validator.ArrayOf(new RawDraftEntityRangeValidator())
			},
			inlineStyleRanges: {
				validator: Validator.ArrayOf(
					new RawDraftInlineStyleRangeValidator()
				)
			},
			key: {
				validator: Validator.String
			},
			type: {
				validator: Validator.OneOfStrict<Draft.DraftBlockType>(
					'unstyled',
					'paragraph',
					'header-one',
					'header-two',
					'header-three',
					'header-four',
					'header-five',
					'header-six',
					'unordered-list-item',
					'ordered-list-item',
					'blockquote',
					'code-block',
					'atomic'
				)
			},
			text: {
				validator: Validator.String
			}
		});
	}
}

export default class RawDraftContentStateValidator extends Validator<
	RawDraftContentState
> {
	constructor() {
		super({
			blocks: {
				validator: Validator.ArrayOf(
					new RawDraftContentBlockValidator()
				)
			},
			entityMap: {
				validator: Validator.Values(new RawDraftEntityValidator())
			}
		});
	}
}
