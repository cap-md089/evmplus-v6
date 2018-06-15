export const SideNavigationActions = {
	REMOVE: 'SIDENAV_REMOVE',
	UPDATE: 'SIDENAV_UPDATE'
};

export type SideNavigationActionType = 'SIDENAV_REMOVE' | 'SIDENAV_UPDATE';

export interface SideNavigationAction {
	type: SideNavigationActionType;
	links?: {
		text: string,
		target: string
	}[];
}

export const removeBreadCrumbs = () => {
	return {
		type: SideNavigationActions.REMOVE
	};
};

export const updateBreadCrumbs = (links: {
	text: string,
	target: string
}[]) => {
	return {
		type: SideNavigationActions.UPDATE,
		links: links
	};
};