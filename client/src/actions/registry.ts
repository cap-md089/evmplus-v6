import Registry from '../registry';

export const updateRegistry = (res: Registry) => {
	return {
		type: 'UPDATE_REGISTRY',
		value: res
	};
};
