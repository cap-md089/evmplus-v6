import Registry from '../registry';

const updateRegistry = (
	state: Registry = {
		Website: {
			Name: '',
			Separator: ''
		},
		Contact: {}
	}, 
	action: {
		type: string,
		value: Registry
	}): Registry => {

	switch (action.type) {
		case 'UPDATE_REGISTRY' :
			return action.value;
		
		default :
			return state;
	}
};

export default updateRegistry;