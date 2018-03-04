export default function (...args: string[]): string {
	let url: string = '';

	if (process && process.env && process.env.NODE_ENV === 'test') {
		url = 'http://localhost:3001/';
	}

	for (let i of args) {
		url += `${i}/`;
	}

	return url;
}