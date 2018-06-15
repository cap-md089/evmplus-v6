import { BreadCrumbsActions, BreadCrumbAction } from '../actions/breadcrumbs';
import { BreadCrumbs } from '../components/BreadCrumbs';

export default (state: BreadCrumbs[] = [], action: BreadCrumbAction) => {
	switch (action.type) {
		case BreadCrumbsActions.REMOVE :
			return [];

		case BreadCrumbsActions.UPDATE :
			return action.links;

		default:
			return state;
	}
};