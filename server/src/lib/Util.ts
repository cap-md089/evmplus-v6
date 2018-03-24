export function extend<T> (obj1: T, obj2: T): T {
	let ret = <T> {};
	for (let i in obj1) {
		if (obj1.hasOwnProperty(i)) {
			ret[i] = obj1[i];
		}
	}
	for (let i in obj2) {
		if (obj2.hasOwnProperty(i)) {
			ret[i] = obj2[i];
		}
	}
	return ret;
}