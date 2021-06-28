/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Basic event emitter
 */
export default class Subscribe<E> {
	private subscribers: Array<(event: E) => void> = [];

	private key = 0;

	public subscribe(subscriber: (event: E) => void): number {
		this.subscribers[this.key] = subscriber;

		return this.key++;
	}

	public unsubscribe(key: number): void {
		delete this.subscribers[key];
	}

	public publish(event: E): void {
		for (const subscriber of this.subscribers) {
			if (subscriber) {
				subscriber(event);
			}
		}
	}
}
