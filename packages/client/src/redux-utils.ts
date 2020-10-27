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

export interface Action<T extends string = any, P = any> {
	type: T;
	payload: P;

	map: (producer: (action: Action<T, P>) => Action) => Action;
}

export interface ActionProducer<Payload, Arguments extends any[], ActionName extends string> {
	(...args: Arguments): Action<ActionName, Payload>;

	toString: () => ActionName;

	handler: <State>(
		reducer: (payload: Payload, state: State) => State,
	) => ActionHandler<State, this>;

	map: (
		producer: (arg: Action<ActionName, Payload>) => Action,
	) => ActionProducer<Action, Arguments, string>;
}

export const createAction = <Payload, Arguments extends any[], ActionName extends string>(
	actionName: ActionName,
	wrap: (...args: Arguments) => Payload,
): ActionProducer<Payload, Arguments, ActionName> => {
	const creator = (...params: Arguments) => ({
		type: actionName,
		payload: wrap(...params),
		map<HT extends string, MA extends Action<ActionName, Payload>>(
			producer: (arg: MA) => Action<HT, MA>,
		): Action<HT, MA> {
			return producer((this as Action) as MA);
		},
	});

	creator.valueOf = () => actionName;
	creator.toString = () => actionName;

	creator.handler = <State>(handler: (payload: Payload, state: State) => State) => [
		creator,
		handler,
	];

	creator.map = (producer: (arg: Action) => Action) => createAction(producer.toString(), creator);

	return (creator as unknown) as ActionProducer<Payload, Arguments, ActionName>;
};

export type ActionFor<
	Producer extends ActionProducer<any, any, any>
> = Producer extends ActionProducer<infer Payload, any, infer ActionName>
	? Action<ActionName, Payload>
	: never;

export type ProducerFor<
	ProducedAction extends Action,
	Arguments extends any[] = any
> = ProducedAction extends Action<infer Name, infer Payload>
	? ActionProducer<Payload, Arguments, Name>
	: null;

export type ProducedPayload<
	Producer extends ActionProducer<any, any, any>
> = Producer extends ActionProducer<infer Payload, any, any> ? Payload : never;

export type ActionHandler<
	State,
	Prod extends ProducerFor<Action> = ProducerFor<Action>
> = readonly [Prod, (payload: ProducedPayload<Prod>, state: State) => State];

export const createReducerForActions = <
	State,
	Handlers extends ReadonlyArray<ActionHandler<State>>
>(
	defaultState: State,
	handlers: Handlers,
) => (state: State, action: ReturnType<any>) =>
	state === undefined
		? defaultState
		: handlers.find(handler => handler[0].valueOf() === action.type)?.[1]?.(
				action.payload,
				state,
		  ) ?? state;

export const mapDispatch = <SubAction extends Action, SuperAction extends Action>(
	actionMapper: (action: SubAction) => SuperAction,
) => (dispatch: (action: SuperAction) => void) => (action: SubAction) =>
	dispatch(actionMapper(action));

export type SubComponent<Model, ComponentAction extends Action> = (
	model: Model,
	actionDispatch: (action: ComponentAction) => void,
) => React.ReactNode;

export const mapComponent = <SubAction extends Action, SuperAction extends Action, Model>(
	component: SubComponent<Model, SubAction>,
	actionMapper: (action: SubAction) => SuperAction,
): SubComponent<Model, SuperAction> => (model: Model, dispatch: (action: SuperAction) => void) =>
	component(model, mapDispatch(actionMapper)(dispatch));

export const dispatcher = <Payload, Name extends string, Args extends any[]>(
	producer: ActionProducer<Payload, Args, Name>,
) => (dispatch: (action: Action<Name, Payload>) => void) => (...args: Args): void =>
	dispatch(producer(...args));
