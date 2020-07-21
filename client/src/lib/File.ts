/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either, FullFileObject, User } from 'common-lib';
import fetchApi from './apis';

interface UploadProgressEvent {
	event: 'PROGRESS';
	progress: number;
}

interface UploadFinishEvent {
	event: 'FINISH';
	file: FullFileObject;
}

export const uploadFile = (user: User) => (parentid: string) =>
	async function*(file: File): AsyncIterableIterator<UploadProgressEvent | UploadFinishEvent> {
		const tokenEither = await fetchApi.token({}, {}, user.sessionID);

		if (Either.isLeft(tokenEither)) {
			throw new Error('Could not get token');
		}

		const token = tokenEither.value;

		const fd = new FormData();
		fd.append('file', file, file.name);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `/api/files/upload/${parentid}`);

		xhr.setRequestHeader('authorization', user.sessionID);
		xhr.setRequestHeader('token', token);

		const results = {
			queue: [] as UploadProgressEvent[],
			callback: void 0 as ((item?: UploadProgressEvent) => void) | undefined,
			doCallback: (callback: (item?: UploadProgressEvent) => void): void => {
				if (results.queue.length > 0) {
					callback(results.queue.shift());
				} else {
					results.callback = callback;
				}
			},
			execute: (): void => {
				if (results.callback) {
					results.callback(results.queue.shift());
					results.callback = void 0;
				}
			},
			push: (item: UploadProgressEvent) => {
				results.queue.push(item);
				results.execute();
			},
			finish: () => {
				if (results.callback) {
					results.callback();
				}
			}
		};
		let done = false;

		xhr.upload.addEventListener('progress', ev => {
			if (ev.lengthComputable) {
				results.push({
					event: 'PROGRESS',
					progress: ev.loaded / ev.total
				});
			}
		});

		xhr.upload.addEventListener('loadend', () => {
			results.push({
				event: 'PROGRESS',
				progress: 1
			});

			done = true;

			results.finish();
		});

		while (!done || results.queue.length > 0) {
			try {
				const value = await new Promise<UploadProgressEvent>((res, rej) => {
					results.doCallback(item => {
						if (!item) {
							rej();
						} else {
							res(item);
						}
					});
				});

				if (value) {
					yield value;
				}
			} catch (e) {
				done = true;
			}
		}

		return new Promise<UploadFinishEvent>((res, rej) => {
			xhr.addEventListener('readystatechange', function(evt: Event) {
				if (this.readyState === 4) {
					const resp = JSON.parse(this.responseText) as FullFileObject;

					res({
						event: 'FINISH',
						file: resp
					});
				}
			});

			xhr.send(fd);
		});
	};
