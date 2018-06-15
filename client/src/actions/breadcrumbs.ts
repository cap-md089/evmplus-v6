import { BreadCrumbs } from '../components/BreadCrumbs';

export const BreadCrumbsActions = {
	REMOVE: 'BREADCRUMBS_REMOVE',
	UPDATE: 'BREADCRUMBS_UPDATE'
};

export type BreadCrumbsActionType = 'BREADCRUMBS_REMOVE' | 'BREADCRUMBS_UPDATE';

export interface BreadCrumbAction {
	type: BreadCrumbsActionType;
	links?: BreadCrumbs[];
}

export const removeBreadCrumbs = () => {
	return {
		type: BreadCrumbsActions.REMOVE
	};
};

export const updateBreadCrumbs = (links: BreadCrumbs[]) => {
	return {
		type: BreadCrumbsActions.UPDATE,
		links: links
	};
};