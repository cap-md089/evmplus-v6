import * as React from 'react';
import Page, { PageProps } from './Page';
import jQuery from 'jquery';

import './PhotoLibrary.css';
import Dialogue, { DialogueButtons } from '../components/dialogues/Dialogue';
import urlFormat from '../lib/urlFormat';
import myFetch from '../lib/myFetch';
import { FullFileObject } from 'common-lib';

interface PhotoLibraryState {
	imageIDs: string[];
	position: number;
	end: boolean;
	currentImage: string | null;
}

export default class PhotoLibrary extends Page<PageProps, PhotoLibraryState> {
	public state: PhotoLibraryState = {
		imageIDs: [],
		position: 0,
		end: false,
		currentImage: null
	};

	private gettingImages: boolean = false;

	public constructor(props: PageProps) {
		super(props);

		this.scrollListener = this.scrollListener.bind(this);
		this.closeDialogue = this.closeDialogue.bind(this);
	}

	public componentDidMount() {
		this.getNewImageIDs();

		window.addEventListener('scroll', this.scrollListener);

		this.updateTitle('Photo library');
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/photolibrary',
				text: 'Photo library'
			}
		]);
		this.props.updateSideNav([]);
	}

	public componentWillUnmount() {
		window.removeEventListener('scroll', this.scrollListener);
	}

	public render() {
		return (
			<div>
				{this.state.currentImage !== null ? (
					<Dialogue
						displayButtons={DialogueButtons.OK}
						open={true}
						onClose={this.closeDialogue}
						title="View image"
					>
						<div className="photolibrary-box-view">
							<img
								className="photolibrary-image-view"
								src={urlFormat('api', 'files', this.state.currentImage, 'export')}
								alt=""
							/>
						</div>
					</Dialogue>
				) : null}
				{this.state.imageIDs.map((id, i) => (
					<div key={i} className="photolibrary-box">
						<img
							alt=""
							className="photolibrary-image"
							src={urlFormat('api', 'files', id, 'export')}
							onClick={this.getImageViewer(i)}
						/>
					</div>
				))}
				{this.state.end ? (
					<div style={{ clear: 'both', textAlign: 'center', fontStyle: 'italic' }}>
						No more photos
					</div>
				) : null}
			</div>
		);
	}

	private async getNewImageIDs() {
		if (this.gettingImages) {
			return;
		}

		if (this.state.end) {
			return;
		}

		this.gettingImages = true;

		const headers = this.props.member
			? {
					authorization: this.props.member.sessionID
			  }
			: {
					authorization: ''
			  };

		const results = await myFetch('/api/files/photolibrary/' + this.state.position, {
			headers
		});

		const imageIDs = await results.json();

		this.setState(
			prev => ({
				imageIDs: [...prev.imageIDs, ...imageIDs.map((file: FullFileObject) => file.id)],
				position: prev.position + 1,
				end: imageIDs.length < this.props.registry.Website.PhotoLibraryImagesPerPage
			}),
			() => {
				this.gettingImages = false;
			}
		);
	}

	private scrollListener() {
		if (
			jQuery(window).scrollTop()! + jQuery(window).height()! >
			jQuery(document).height()! - 100
		) {
			this.getNewImageIDs();
		}
	}

	private getImageViewer(index: number) {
		return () => {
			this.setState(prev => ({
				currentImage: prev.imageIDs[index]
			}));
		};
	}

	private closeDialogue() {
		this.setState({
			currentImage: null
		});
	}
}
