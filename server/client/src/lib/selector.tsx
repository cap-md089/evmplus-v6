import myFetch from './myFetch';
import * as $ from 'jquery';
import { Identifiable, FileObject } from '../../../src/types';
import { DialogueAction } from '../actions/dialogue';
import * as React from 'react';

const isFile = (file: any, displayPhotos: boolean): file is FileObject => {
	return false;
};

const height = (length: number) => Math.min(
	Math.min(42 * 12, $(window).height() as number * 0.4),
	42 * length
);

const generateHtml = <T extends Identifiable>(
	files: T[],
	displayDialogue: Function,
	multiple: boolean = true,
	displayFunction: (obj: T) => string,
	filter: (obj: T) => boolean = () => true,
	displayPhotos: boolean = false
) => {
	const filesHtml = files
		.filter(filter)
		.map((file, i) =>
			(
				<>
					<input
						name="dialogueSelecter"
						type={multiple ? 'checkbox' : 'radio'}
						id={'select' + file.id}
						value={file.id}
						className="selecterTestStuff"
					/>
					<label
						className="shown selecterTestStuffLabel"
						htmlFor={'select' + file.id}
					>
						{displayFunction(file)}
						{
							isFile(file, displayPhotos) ?
								(
									<div
										className="image-box popupimage popupimage2"
									>
										<img
											className="image"
											src={'/api/imageview/' + file.id}
										/>
									</div>
								) : null
						}
					</label>
				</>
			)
		);
	return (
		<form
			id="fileSelect"
		>
			<div
				className="labels"
				style={{
					overflow: 'auto',
					paddingTop: 1,
					height: height(files.length)
				}}
			>
				{filesHtml}
			</div>
		</form>
	);
};

export default <T extends Identifiable>(
	displayDialogue: (data: DialogueAction) => void,
	url: '/api/files' | '/api/member',
	title: string,
	multiple: boolean = true,
	displayFunction: (obj: T) => string,
	filter: (obj: T) => boolean = () => true,
	displayPhotos: boolean = false
): Promise<(string | number)[]> => {
	return new Promise((res, rej) => {
		myFetch(url)
			.then(val =>
				val.json())
			.then((files: T[]) => {
				const html = generateHtml<T>(
					files,
					displayDialogue,
					multiple,
					displayFunction,
					filter,
					displayPhotos
				);
				displayDialogue({
					type: 0,
					title: 'Select files',
					text: html,
					buttontext: 'Select',
					displayButton: true,
					onClose: () => {
						let ret: (string | number)[] = [];
						$('#fileSelect input:checked').each(function () {
							const int = parseInt($(this).val() as string, 10);
							if (int !== int) {
								ret.push($(this).val() as string);
							} else {
								ret.push(int);
							}
						});
						res(ret);
					}
				});
			});
	});
};