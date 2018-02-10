import { SideNavigationActions, SideNavigationAction } from '../actions/sidenavigation';

export default (
	state: {

	} = [],
	action: SideNavigationAction) => {
	switch (action.type) {
		case SideNavigationActions.REMOVE :
			return [];

		case SideNavigationActions.UPDATE :
			return action.links;

		default:
			return state;
	}
};