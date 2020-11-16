import { ActionFor, createAction, createReducerForActions } from '../lib/redux-utils';

describe('redux-utils', () => {
	const action1 = createAction('Increment', () => '');
	const action2 = createAction('Update', (val: string) => parseInt(val, 10));
	const wrappedAction = createAction(
		'Wrapped',
		(action: ActionFor<typeof action2> | ActionFor<typeof action1>) => action,
	);
	const action3 = createAction('Another', () => 3);

	const reducer1 = createReducerForActions(
		0,
		action1.handler((payload, state: number) => state + 1),
		action2.handler((payload, state: number) => payload),
		wrappedAction.handler((payload, state: number) =>
			payload.type === 'Increment' ? state + 1 : payload.payload,
		),
	);

	const action4 = createAction('Update', (val: number) => val);
	type State =
		| {
				type: 'Loading';
		  }
		| {
				type: 'Loaded';
				value: number;
		  };
	const reducer2 = createReducerForActions(
		{ type: 'Loading' } as State,
		action4.stateHandler<State>({
			Loaded: (value, state) => ({
				...state,
				value,
			}),
		}),
	);

	it('should create simple actions', () => {
		expect(action1()).toMatchObject({ type: 'Increment', payload: '' });
	});

	it('should create actions with arguments', () => {
		expect(action2('3')).toMatchObject({ type: 'Update', payload: 3 });
	});

	it('should reduce basic actions', () => {
		// Action 1 is causes an increment
		expect(reducer1(0, action1())).toEqual(1);
		// Action 2 sets the value
		expect(reducer1(0, action2('4'))).toEqual(4);
		// Wrapped actions
		expect(reducer1(0, action1().wrap(wrappedAction))).toEqual(1);
		expect(reducer1(0, action2.wrap(wrappedAction)('4'))).toEqual(4);
		// Action 3 is ignored. As there is no handler defined, not only will
		// the reducer return the state, but TypeScript should throw an error
		// @ts-expect-error
		expect(reducer1(0, action3())).toEqual(0);
	});

	it('should map and wrap actions', () => {
		expect(action1().wrap(wrappedAction)).toMatchObject({
			type: 'Wrapped',
			payload: { type: 'Increment', payload: '' },
		});
		expect(action1.wrap(wrappedAction)()).toMatchObject({
			type: 'Wrapped',
			payload: { type: 'Increment', payload: '' },
		});
		expect(action2('3').wrap(wrappedAction)).toMatchObject({
			type: 'Wrapped',
			payload: { type: 'Update', payload: 3 },
		});
		expect(action2.wrap(wrappedAction)('3')).toMatchObject({
			type: 'Wrapped',
			payload: { type: 'Update', payload: 3 },
		});

		// @ts-expect-error
		action3.wrap(wrappedAction);
		// @ts-expect-error
		action3().wrap(wrappedAction);
	});

	it('should handle different states', () => {
		const loading = { type: 'Loading' } as const;
		expect(reducer2(loading, action4(3))).toMatchObject(loading);
		expect(reducer2({ type: 'Loaded', value: 0 }, action4(3))).toMatchObject({
			type: 'Loaded',
			value: 3,
		});
	});
});
