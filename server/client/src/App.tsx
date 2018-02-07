import * as React from 'react';
// import * as jQuery from 'jquery';

import Registry from './registry';
import { NavLink } from 'react-router-dom';

import BreadCrumbs from './components/BreadCrumbs';
import PageRouter from './components/PageRouter';
import SideNavigation from './components/SideNavigation';

import jQuery from './jquery.textfit';

export class Head extends React.Component {
	render() {
		return (
			<div>
				<meta name="ROBOTS" content="INDEX, FOLLOW" />
				<title>React app</title>
			</div>
		);
	}
}

export class Signin extends React.Component<{}, {
	name: string,
	password: string
}> {
	constructor (props: {}) {
		super(props);
		this.submit = this.submit.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.state = {
			name: '',
			password: ''
		};
	}

	submit (e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		parent.postMessage(this.state, '*');
	}

	handleChange (e: React.FormEvent<HTMLInputElement>) {
		e.preventDefault();
		let s = this.state;
		s[e.currentTarget.name] = e.currentTarget.value;
		this.setState(s);
	}

	render() {
		return (
			<form target="_parent" onSubmit={this.submit}>
				<input type="text" name="name" onChange={this.handleChange} value={this.state.name} />
				<input type="password" name="password" onChange={this.handleChange} value={this.state.password} />
				<input type="submit" value="Submit" />
			</form>
		);
	}
}

class SearchForm extends React.Component<{}, {
	text: string
}> {
	constructor(props: {}) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.state = {
			text: ''
		};
	}

	handleChange(e: React.FormEvent<HTMLInputElement>) {
		e.preventDefault();
		this.setState({
			text: e.currentTarget.value
		});
	}

	handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		return;
	}

	render() {
		return ( 
			<form 
				id="search"
				onSubmit={this.handleSubmit}
			>
				<div role="search">
					<input
						className="searchInput"
						name="search"
						placeholder="Search..."
						type="text"
						aria-label="Search through site content"
						value={this.state.text}
						onChange={this.handleChange}
					/>
					<input
						className="search-btn submitBt"
						name="search"
						placeholder="Search..."
						type="submit"
						value=""
						aria-label="Search through site content"
					/>
				</div>
			</form>
		);
	}
}

export default class App extends React.Component<{
	isMobile: boolean
}, {
	Registry: Registry
}> {
	
	public state: {
		Registry: Registry
	} = {
		Registry: {
			Website: {
				Name: '',
				Separator: ''
			},
			Contact: {}
		}
	};
	
	private titleElement: HTMLDivElement;

	constructor(props: {
		isMobile: boolean
	}) {
		super(props);
	}

	componentDidMount(): void {
		// Load registry
		fetch('/api/registry', {
			method: 'post'
		})
			.then(res => {
				return res.json();
			})
			.then((res: {
					value: Registry
				}) => {
				this.setState({
					...this.state,
					Registry: {
						...res.value
					}
				});
			});
	}

	render() {
		setTimeout(() => {
			jQuery(this.titleElement).textfit('bestfit');
		});

		let countd = 0;

		if (this.state.Registry.Contact.MailingAddress) {
			countd++;
		}
		if (this.state.Registry.Contact.MeetingAddress) {
			countd++;
		}

		let count = [
			'half',
			'third',
			'fourth'
		][countd];

		return (
			<div
				className={
					this.props.isMobile ? 'mobile' : 'desktop'
				}
			>
				<div 
					id="bodyContainer"
				>
					<div id="page">
						<header>
							<div id="logo">
								<a>
									<img src="/images/logo.png" alt="Civil Air Patrol" height="127" />
								</a>
							</div>
							<div className="headerDivider" />
							<div 
								className="pagetitle"
								ref={(div) => {
									if (div) {
										this.titleElement = div;
									}
								}}
							>
								{
									this.state.Registry.Website.Name
								}
							</div>
							<div className="servings">
								<span className="servingsTitle">Citizens Serving<br />Communities</span>
							</div>
							<nav id="mainNavigation">
								<ul>
									<li>
										<NavLink to="/" exact={true} activeClassName="selected">Home</NavLink>
									</li>
									<li>
										<NavLink to="/news" activeClassName="selected">News</NavLink>
									</li>
									<li>
										<NavLink to="/calendar" activeClassName="selected">Calendar</NavLink>
									</li>
									<li>
										<NavLink to="/photolibrary" activeClassName="selected">Photo Library</NavLink>
									</li>
								</ul>
								<div className="search">
									<SearchForm />
								</div>
							</nav>
						</header>
						<div id="pageContent">
							<div className="contentBorder" />
							<div className="mainContent">
								<div className="slideshowTop" />
								<div className="slideshow">
									<div className="image" />
								</div>
								<div className="slideshowBottom" />
								<div id="body">
									<div id="content">
										<div id="fb-root" />
										<BreadCrumbs />
										<PageRouter />
									</div>
									<SideNavigation />
								</div>
								<div className="mainContentBottom" />
							</div>
							<div className="contentBorder" />
						</div>
					</div>
				</div>
				<div id="footer">
					<div className="page">
						<div className={count + 'Box'}>
							<div className="footerBoxTitle">Connect With Us</div>
							<p>
								{
									[
										this.state.Registry.Contact.FaceBook ?
											<a
												href={'https://www.facebook.com/' + this.state.Registry.Contact.FaceBook}
												target="_blank"
												className="socialMedia fb"
											/> :
											null,
										this.state.Registry.Contact.Twitter ?
											<a
												href={'https://www.twitter.com/' + this.state.Registry.Contact.Twitter}
												target="_blank"
												className="socialMedia twitter"
											/> :
											null,
										this.state.Registry.Contact.YouTube ?
											<a
												href={'https://www.youtube.com/channel/' + this.state.Registry.Contact.YouTube}
												target="_blank"
												className="socialMedia youtube"
											/> :
											null,
										this.state.Registry.Contact.LinkedIn ?
											<a
												href={'https://in.linkedin.com/in/' + this.state.Registry.Contact.LinkedIn}
												target="_blank"
												className="socialMedia linkedin"
											/> :
											null,
										this.state.Registry.Contact.Instagram ?
											<a
												href={'https://www.instagram.com/' + this.state.Registry.Contact.Instagram}
												target="_blank"
												className="socialMedia instagram"
											/> :
											null,
										this.state.Registry.Contact.Flickr ?
											<a
												href={'https://www.flickr.com/photos/' + this.state.Registry.Contact.Flickr}
												target="_blank"
												className="socialMedia flickr"
											/> :
											null
									]
								}
							</p>
						</div>
						{
							this.state.Registry.Contact.MeetingAddress ?
								<div className={count + 'Box'}>
									<div className="footerBoxTitle">Meeting Address</div>
									<p>
										{`${this.state.Registry.Contact.MeetingAddress.Name}<br />
											${this.state.Registry.Contact.MeetingAddress.FirstLine}<br />
											${this.state.Registry.Contact.MeetingAddress.SecondLine}`}
									</p>
								</div> :
								null
						}
						{
							this.state.Registry.Contact.MailingAddress ?
								<div className={count + 'Box'}>
									<div className="footerBoxTitle">Mailing Address</div>
									<p>
										{`${this.state.Registry.Contact.MailingAddress.Name}<br />
											${this.state.Registry.Contact.MailingAddress.FirstLine}<br />
											${this.state.Registry.Contact.MailingAddress.SecondLine}`}
									</p>
								</div> :
								null
						}
						<div className={count + 'Box'}>
							<div className="footerBoxTitle">Resources</div>
							<ul
								style={{
									'list-style-type': 'none',
									'padding': '0px',
									'margin': '0px'
								}}
							>
								<li><a target="_blank" href="https://www.capnhq.gov/">eServices</a></li>
								<li><a target="_blank" href="http://www.cap.news/">Latest CAP News</a></li>
							</ul>
						</div>
						<div
							style={{
								'color': 'white'
							}}
							className="onlyBox"
						>
							<div
								style={{
									'float': 'left',
									'font-size': '12px'
								}}
							>
								&copy; 2017-{
									new Date().getFullYear()
								} CAPUnit.com, {this.state.Registry.Website.Name}
							</div>
							<div
								style={{
									'float': 'right',
									'font-size': '12px'
								}}
							>
								<a target="_blank" href="http://www.capmembers.com/">CAP Members.com</a> |
								<a target="_blank" href="http://www.cap.news/">CAP News</a> |
								<a 
									href="#"
									onClick={
										() => {
											jQuery('html').animate(
												{scrollTop: 0},
												'slow'
											);
											return false;
										}
									}
								>
									Top
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}