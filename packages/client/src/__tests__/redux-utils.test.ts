import { ActionFor, createAction, createReducerForActions } from '../redux-utils';

describe('redux-utils', () => {
	const action1 = createAction('Increment', () => '');
	const action2 = createAction('Update', (val: string) => parseInt(val, 10));
	const mappedAction = createAction(
		'Page',
		(action: ActionFor<typeof action2> | ActionFor<typeof action1>) => action,
	);
	const action3 = createAction('Another', () => 3);

	const reducer = createReducerForActions(0, [
		action1.handler((payload, state) => state + 1),
		action2.handler((payload, state) => payload),
		mappedAction.handler((payload, state) =>
			typeof payload.payload === 'string' ? state : payload.payload,
		),
	]);

	it('should create simple actions', () => {
		expect(action1()).toMatchObject({ type: 'Increment', payload: '' });
	});

	it('should create actions with arguments', () => {
		expect(action2('3')).toMatchObject({ type: 'Update', payload: 3 });
	});

	it('should reduce basic actions', () => {
		// Action 1 is causes an increment
		expect(reducer(0, action1())).toEqual(1);
		// Action 2 sets the value
		expect(reducer(0, action2('4'))).toEqual(4);
		// Action 3 is ignored
		expect(reducer(0, action3())).toEqual(0);
	});

	it('should map and wrap actions', () => {
		expect(action1().map(mappedAction)).toMatchObject({
			type: 'Page',
			payload: { type: 'Increment', payload: '' },
		});
		expect(action1.map(mappedAction)()).toMatchObject({
			type: 'Page',
			payload: { type: 'Increment', payload: '' },
		});
		expect(action2('3').map(mappedAction)).toMatchObject({
			type: 'Page',
			payload: { type: 'Update', payload: 3 },
		});
		expect(action2.map(mappedAction)('3')).toMatchObject({
			type: 'Page',
			payload: { type: 'Update', payload: 3 },
		});

		// @ts-expect-error
		action3.map(mappedAction);
		// @ts-expect-error
		action3().map(mappedAction);
	});
});
