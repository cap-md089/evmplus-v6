export default class Subscribe<E> {
	private subscribers: Array<((event: E) => void)> = [];

	private key: number = 0;

	public subscribe (subscriber: (event: E) => void) {
		this.subscribers[this.key] = subscriber;

		return this.key++;
	}

	public unsubscribe (key: number) {
		delete this.subscribers[key];
	}

	public publish (event: E) {
		for (const subscriber of this.subscribers) {
			if (subscriber) {
				subscriber(event);
			}
		}
	}
}