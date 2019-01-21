import * as React from 'react';
import Page, { PageProps } from '../Page';
import BlogPage from 'src/lib/BlogPage';
import Loader from 'src/components/Loader';
import DraggableBlogPage from 'src/components/DraggableBlogPage';

interface PagesLoading {
	loading: true;
	pages: null;
	rootHover: false;
}

interface PagesLoaded {
	loading: false;
	pages: BlogPage[];
	rootHover: boolean;
}

const defaultCursorStyle: React.CSSProperties = {
	cursor: 'initial'
};

export default class PageList extends Page<
	PageProps,
	PagesLoaded | PagesLoading
> {
	public state: PagesLoaded | PagesLoading = {
		loading: true,
		pages: null,
		rootHover: false
	};

	private pages: BlogPage[] | null = null;

	public constructor(props: PageProps) {
		super(props);

		this.onPageDrop = this.onPageDrop.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		this.handleOff = this.handleOff.bind(this);
		this.handleOver = this.handleOver.bind(this);
	}

	public async componentDidMount() {
		const pages = await this.props.account.getBlogPages();

		this.setState({
			pages,
			loading: false
		});
	}

	public render() {
		if (this.state.loading) {
			return <Loader />;
		}

		const pagesToUse = this.getPageList();
		const ableToManage =
			!!this.props.member && this.props.member.canManageBlog();

		return (
			<div>
				{ableToManage ? (
					<div
						className="draggable-page able-to-manage"
						onDragOver={this.handleOver}
						onDragEnd={this.handleOff}
						onDragLeave={this.handleOff}
						onDragEnter={this.handleOver}
						onDrop={this.handleDrop}
						style={defaultCursorStyle}
					>
						Main page
					</div>
				) : null}
				{pagesToUse.map((page, i) => (
					<DraggableBlogPage
						ableToManage={ableToManage}
						key={i}
						page={page}
						onDrop={this.onPageDrop}
						pageList={pagesToUse}
					/>
				))}
			</div>
		);
	}

	private async onPageDrop(targetPage: BlogPage, fromPage: BlogPage) {
		if (!this.props.member || !this.props.member.canManageBlog()) {
			return;
		}

		await fromPage.moveTo(targetPage, this.props.member);

		this.cleanAncestry(this.pages!, fromPage, true);
		this.getPageList(undefined, true);
		this.forceUpdate();
	}

	private getPageList(page?: BlogPage, force = false) {
		if (this.pages !== null) {
			if (!force) {
				return this.pages;
			}
			this.pages = [];
		}

		const returnList: BlogPage[] = [];

		if (!page) {
			const basePages = this.state.pages!.filter(
				p => p.parentID === null
			);

			for (const basePage of basePages) {
				returnList.push(basePage);

				const children = this.getPageList(basePage);

				for (const childPage of children) {
					returnList.push(childPage);
				}
			}

			this.pages = returnList;
		} else {
			const childrenPages = this.state.pages!.filter(
				p => p.parentID === page.id
			);

			for (const child of childrenPages) {
				returnList.push(child);

				const grandChildren = this.getPageList(child);

				for (const grandChild of grandChildren) {
					returnList.push(grandChild);
				}
			}
		}

		return returnList;
	}

	private handleOver() {
		this.setState({
			rootHover: true
		});
	}

	private handleOff() {
		this.setState({
			rootHover: false
		});
	}

	private async handleDrop(e: React.DragEvent<HTMLDivElement>) {
		if (!this.props.member || !this.props.member.canManageBlog()) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();

		const thatPageID = e.dataTransfer.getData('text');

		const thatPage = this.state.pages!.filter(
			page => page.id === thatPageID
		)[0];
		const thatPageParent = this.state.pages!.filter(
			page => page.id === thatPage.parentID
		)[0];

		if (thatPageParent) {
			await thatPageParent.removeChild(thatPage, this.props.member);

			this.cleanAncestry(this.pages!, thatPage);
			this.getPageList(undefined, true);
			this.forceUpdate();
		}
	}

	private cleanAncestry(pageList: BlogPage[], parentPage?: BlogPage, force = false) {
		const parentID = parentPage ? parentPage.id : null;
		const ancestry = parentPage
			? [
					...parentPage.ancestry,
					{
						id: parentPage.id,
						title: parentPage.title
					}
			  ]
			: [];

		const children = pageList.filter(page => page.parentID === parentID);

		for (const child of children) {
			child.ancestry = ancestry;

			this.cleanAncestry(pageList, child);
		}

		if (!parentPage) {
			this.getPageList(undefined, true);
		}
	}
}