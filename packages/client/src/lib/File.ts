/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either, FullFileObject } from 'common-lib';
import fetchApi from './apis';
import debug from 'debug';

const logFunc = debug('client:lib:file');

interface UploadProgressEvent {
	event: 'PROGRESS';
	progress: number;
}

interface UploadFinishEvent {
	event: 'FINISH';
	files: FullFileObject[];
}

export const uploadFile = (parentid: string) =>
	async function* (
		files: File[],
	): AsyncIterableIterator<UploadProgressEvent | UploadFinishEvent> {
		const tokenEither = await fetchApi.token({}, {});

		if (Either.isLeft(tokenEither)) {
			throw new Error('Could not get token');
		}

		const token = tokenEither.value;

		const fd = new FormData();
		for (const file of files) {
			fd.append('file-' + file.name, file, file.name);
		}

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `/api/files/upload/${parentid}`);

		xhr.withCredentials = true;

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
			},
		};

		xhr.upload.addEventListener('progress', ev => {
			if (ev.lengthComputable) {
				results.push({
					event: 'PROGRESS',
					progress: ev.loaded / ev.total,
				});
			}
		});

		xhr.upload.addEventListener('loadend', () => {
			results.push({
				event: 'PROGRESS',
				progress: 1,
			});

			results.finish();
		});

		const uploadPromise = new Promise<UploadFinishEvent>(res => {
			xhr.addEventListener('readystatechange', function () {
				logFunc('Ready state changed during file upload: %d', this.readyState);
				if (this.readyState === 4) {
					const resp = JSON.parse(this.responseText) as FullFileObject[];

					res({
						event: 'FINISH',
						files: resp,
					});
				}
			});

			logFunc('Sending file');

			xhr.send(fd);
		});

		while (true) {
			const value = await Promise.race([
				new Promise<UploadProgressEvent>((res, rej) => {
					results.doCallback(item => {
						if (!item) {
							rej();
						} else {
							res(item);
						}
					});
				}),
				new Promise<UploadFinishEvent>((res, rej) => {
					uploadPromise.then(res, rej);
				}),
			]);

			if (value.event === 'FINISH') {
				yield value;
				return;
			}

			if (value) {
				yield value;
			}
		}
	};
