export function extend<T> (obj1: T, obj2: Partial<T>): T {
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

export async function orderlyExecute<T, S> (
	promiseFunction: (val: S) => Promise<T>,
	values: S[]
): Promise<T[]> {
	let ret: T[] = [];
	for (let i = 0; i < values.length; i++) {
		ret.push(await promiseFunction(values[i]));
	}
	return ret;
}