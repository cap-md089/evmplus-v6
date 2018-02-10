export enum SideNavigationActions {
	REMOVE,
	UPDATE
}

export interface SideNavigationAction {
	type: SideNavigationActions;
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