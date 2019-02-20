export default () => {
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function (searchString: string, position: number = 0) {
			return this.indexOf(searchString, position) === position;
		};

		String.prototype.endsWith = function (searchString: string) {
			return this.indexOf(searchString, this.length - searchString.length) !== -1;
		};
	}
}