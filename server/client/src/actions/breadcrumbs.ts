import { BreadCrumbs } from '../components/BreadCrumbs';

export enum BreadCrumbsActions {
	REMOVE,
	UPDATE
}

export interface BreadCrumbAction {
	type: BreadCrumbsActions;
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