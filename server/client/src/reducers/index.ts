import { combineReducers } from 'redux';

import updateRegistry from './registry';
import breadcrumbs from './breadcrumbs';
import sidenavigation from './sidenavigation';
import signedInUser from './signedInUser';

export default combineReducers({
	Registry: updateRegistry,
	BreadCrumbs: breadcrumbs,
	SideNavigation: sidenavigation,
	SignedInUser: signedInUser,
});