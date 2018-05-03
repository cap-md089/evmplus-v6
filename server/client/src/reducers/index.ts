import { combineReducers } from 'redux';

import dialogue from './dialogue';
import updateRegistry from './registry';
import breadcrumbs from './breadcrumbs';
import sidenavigation from './sidenavigation';
import signedInUser from './signedInUser';
import fileDialogue from './fileDialogue';

export default combineReducers({
	Dialogue: dialogue,
	Registry: updateRegistry,
	BreadCrumbs: breadcrumbs,
	SideNavigation: sidenavigation,
	SignedInUser: signedInUser,
	FileDialogue: fileDialogue
});