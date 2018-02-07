import dialogue from './dialogue';
import updateRegistry from './registry';
import { combineReducers } from 'redux';

export default combineReducers({
	dialogue,
	Registry: updateRegistry
});