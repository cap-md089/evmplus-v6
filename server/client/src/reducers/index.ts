import dialogue from './dialogue';
import updateRegistry from './registry';
import breadcrumbs from './breadcrumbs';
import sidenavigation from './sidenavigation';

import { combineReducers } from 'redux';

export default combineReducers({
	Dialogue: dialogue,
	Registry: updateRegistry,
	BreadCrumbs: breadcrumbs,
	SideNavigation: sidenavigation
});