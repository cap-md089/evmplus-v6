/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { utilTypes } from 'common-lib';

/**
 * Defines an action that is used to communicate something happening
 */
export interface Action<T extends string = any, P = any> {
	/**
	 * A descriminant to determine what kind of action this is
	 */
	type: T;
	/**
	 * The payload of the action
	 */
	payload: P;

	/**
	 * Takes this action and wraps it in another action
	 */
	wrap: <R extends Action>(producer: (action: Action<T, P>) => R) => R;
}

/**
 * Represents a function which can produce an action while also providing utilites to
 * create other actions or a handler with the `createReducerForActions` function below
 */
export interface ActionProducer<Payload, Arguments extends any[], ActionName extends string> {
	/**
	 * Calling an action producer with the arguments produces the target payload and wraps
	 * it in an action
	 */
	(...args: Arguments): Action<ActionName, Payload>;

	/**
	 * Returns the action name for this producer
	 */
	toString: () => ActionName;

	/**
	 * Creates a handler that can be used in the `createReducerForActions` function below
	 *
	 * @param reducer the reducer for this specific action and the state that this action
	 * 	is targeting
	 */
	handler: <State>(
		reducer: (payload: Payload, state: State) => State,
	) => ActionHandler<State, this>;

	/**
	 * Wraps actions produced by this producer in another type of action.
	 *
	 * This results in a new action creator that takes the arguments for this
	 * 	producer, but results in the type returned from the wrapper
	 *
	 * @param wrapper the action wrapper
	 */
	wrap: <R extends Action>(
		wrapper: (arg: Action<ActionName, Payload>) => R,
	) => ActionProducer<
		R extends Action<any, infer P> ? P : any,
		Arguments,
		R extends Action<infer Name> ? Name : string
	>;
}

/**
 * Sets up an action producer which can generate new actions with some
 * utilities
 *
 * @template Payload the payload of the new action
 * @template Arguments the arguments needed to build the action
 * @template ActionName the action descriminant
 *
 * @param actionName the name of the descriminant of an action
 * @param builder the builder of the action payload given arguments
 *
 * @return {ActionProducer<Payload, Arguments, ActionName>} an object
 * 	which can produce an action with the given arguments
 */
export const createAction = <Payload, Arguments extends any[], ActionName extends string>(
	actionName: ActionName,
	builder: (...args: Arguments) => Payload,
): ActionProducer<Payload, Arguments, ActionName> => {
	const creator = (...params: Arguments) => ({
		type: actionName,
		payload: builder(...params),
		wrap<R extends Action>(producer: (arg: Action<ActionName, Payload>) => R): R {
			return producer(this);
		},
	});

	creator.toString = () => actionName;

	creator.handler = <State>(handler: (payload: Payload, state: State) => State) => [
		creator,
		handler,
	];

	creator.wrap = (producer: (arg: Action) => Action) =>
		createAction(producer.toString(), creator);

	return (creator as unknown) as ActionProducer<Payload, Arguments, ActionName>;
};

/**
 * Utility type to get the produced action of an action producer
 */
export type ActionFor<
	Producer extends ActionProducer<any, any, any>
> = Producer extends ActionProducer<infer Payload, any, infer ActionName>
	? Action<ActionName, Payload>
	: never;

/**
 * Utility type to get the action producer of a produced action
 */
export type ProducerFor<
	ProducedAction extends Action,
	Arguments extends any[] = any
> = ProducedAction extends Action<infer Name, infer Payload>
	? ActionProducer<Payload, Arguments, Name>
	: null;

/**
 * Utility type to get the payload of an action produced by an action producer
 */
export type ProducedPayload<
	Producer extends ActionProducer<any, any, any>
> = Producer extends ActionProducer<infer Payload, any, any> ? Payload : never;

/**
 * Represents a handler used by `createReducerForActions`; a tuple which has
 * action creator and then the handler for an action created by that action
 */
export type ActionHandler<
	State,
	Prod extends ProducerFor<Action> = ProducerFor<Action>
> = readonly [Prod, (payload: ProducedPayload<Prod>, state: State) => State];

/**
 * Converts a list of ActionHandlers and the state modified by them to a
 * union of the actions provided by the producers in the action handlers
 */
export type ActionListUnion<State, TL extends utilTypes.TypeList<ActionHandler<State>, any>> = {
	recurse:
		| ActionFor<TL['head']['0']>
		| (TL['tail'] extends utilTypes.TypeList<ActionHandler<State>, any>
				? ActionListUnion<State, TL['tail']>
				: never);
	base: ActionFor<TL['head']['0']>;
	// base: Current | ActionFor<TL['head']['0']>;
}[TL extends utilTypes.TypeList<any, null> ? 'base' : 'recurse'];

/**
 * Creates a reducer for specific actions that have handlers provided
 *
 * @template State the state reduced
 * @template Handlers the handlers that are used for actions
 *
 * @param {State} defaultState specifies the default state to use if the state passed
 * 	to the resulting reducer is undefined
 * @param {...Handlers} handlers the handlers that handle state being reduced
 *
 * @returns a reducer which can generate a new state based off of the previous state
 * 	and an action
 */
export const createReducerForActions = <State, Handlers extends Array<ActionHandler<State>>>(
	defaultState: State,
	...handlers: Handlers
) => (
	state: State | undefined,
	// Tested in redux-utils.test.ts
	// @ts-ignore
	action: ActionListUnion<State, utilTypes.TupleToTypeList<Handlers>>,
) =>
	state === undefined
		? defaultState
		: // Tested in redux-utils.test.ts
		  // @ts-ignore
		  handlers.find(handler => handler[0].toString() === action.type)?.[1]?.(
				// Tested in redux-utils.test.ts
				// @ts-ignore
				action.payload,
				state,
		  ) ?? state;

/**
 * Wraps all calls to dispatch, such that the actions provided are wrapped with the
 * specified type
 *
 * @param actionWrapper a function which wraps actions passed to dispatch
 * @param dispatch the dispatch function to use
 *
 * @returns a new dispatch function where the dispatched actions are wrapped by
 * 	actionWrapper
 */
export const mapDispatch = <SubAction extends Action, SuperAction extends Action>(
	actionWrapper: (action: SubAction) => SuperAction,
) => (dispatch: (action: SuperAction) => void) => (action: SubAction) =>
	dispatch(actionWrapper(action));

/**
 * Represents an MVC component where Model and Controller are handled with the dispatch
 * and model parameters using Redux and the Elm architecture, but View is handled by React
 */
export type SubComponent<Model, ComponentAction extends Action> = (
	model: Model,
	actionDispatch: (action: ComponentAction) => void,
) => React.ReactElement;

/**
 * Takes a component and produces a new component where all the actions are wrapped by
 * the action wrapper provided
 *
 * @param component the component to wrap actions for
 * @param actionWrapper a wrapper for the actions produced by the component
 *
 * @returns a new component with all the actions wrapped by actionWrapper
 */
export const mapComponent = <SubAction extends Action, SuperAction extends Action, Model>(
	component: SubComponent<Model, SubAction>,
	actionWrapper: (action: SubAction) => SuperAction,
): SubComponent<Model, SuperAction> => (model: Model, dispatch: (action: SuperAction) => void) =>
	component(model, mapDispatch(actionWrapper)(dispatch));

/**
 * Produces a callback function which generates actions
 *
 * @param producer the producer of an action
 * @param dispatch the dispatch function which handles the action
 *
 * @returns a callback function which dispatches an action given its arguments
 */
export const dispatcher = <Payload, Name extends string, Args extends any[]>(
	producer: ActionProducer<Payload, Args, Name>,
) => (dispatch: (action: Action<Name, Payload>) => void) => (...args: Args): void =>
	dispatch(producer(...args));
