import { get, Maybe, MaybeObj, pipe, RegistryValues, WebsiteContact } from 'common-lib';
import * as React from 'react';
import './Footer.scss';

interface FooterProps {
	registry: MaybeObj<RegistryValues>;
}

const preventClick = (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
	return false;
};

const addressToDisplay = ({
	Name,
	FirstLine,
	SecondLine
}: Exclude<WebsiteContact['MeetingAddress'], null>) => (
	<div>
		<div className="footerBoxTitle">Meeting Address</div>
		<p>
			{Name}
			<br />
			{FirstLine}
			<br />
			{SecondLine}
		</p>
	</div>
);

export default (({ registry }) => (
	<footer>
		<div className="contact">
			<div>
				<div className="footerBoxTitle">Connect With Us</div>
				<p>
					{Maybe.orSome<Array<null | React.ReactChild>>([])(
						Maybe.map<RegistryValues, Array<null | React.ReactChild>>(reg => [
							reg.Contact.FaceBook ? (
								<a
									href={`https://www.facebook.com/${reg.Contact.FaceBook}`}
									target="_blank"
									className="social-media fb"
									rel="noopener noreferrer"
								>
									Facebook
								</a>
							) : null,
							reg.Contact.Twitter ? (
								<a
									href={`https://www.twitter.com/${reg.Contact.Twitter}`}
									target="_blank"
									className="social-media twitter"
									rel="noopener noreferrer"
								>
									Twitter
								</a>
							) : null,
							reg.Contact.YouTube ? (
								<a
									href={`https://www.youtube.com/channel/${reg.Contact.YouTube}`}
									target="_blank"
									className="social-media youtube"
									rel="noopener noreferrer"
								>
									YouTube
								</a>
							) : null,
							reg.Contact.LinkedIn ? (
								<a
									href={`https://in.linkedin.com/in/${reg.Contact.LinkedIn}`}
									target="_blank"
									className="social-media linkedin"
									rel="noopener noreferrer"
								>
									LinkedIn
								</a>
							) : null,
							reg.Contact.Instagram ? (
								<a
									href={`https://www.instagram.com/${reg.Contact.Instagram}`}
									target="_blank"
									className="social-media instagram"
									rel="noopener noreferrer"
								>
									Instagram
								</a>
							) : null,
							reg.Contact.Flickr ? (
								<a
									href={`https://www.flickr.com/photos/${reg.Contact.Flickr}`}
									target="_blank"
									className="social-media flickr"
									rel="noopener noreferrer"
								>
									Flickr
								</a>
							) : null,
							reg.Contact.Discord ? (
								<a
									href={`https://discord.gg/${reg.Contact.Discord}`}
									target="_blank"
									className="social-media discord"
									rel="noopener noreferrer"
								>
									Discord
								</a>
							) : null
						])(registry)
					)}
				</p>
			</div>
			{pipe(
				Maybe.map<RegistryValues, WebsiteContact>(get('Contact')),
				Maybe.map(get('MeetingAddress')),
				Maybe.flatMap(Maybe.fromValue),
				Maybe.map(addressToDisplay),
				Maybe.orSome<React.ReactChild | null>(null)
			)(registry)}
			{pipe(
				Maybe.map<RegistryValues, WebsiteContact>(get('Contact')),
				Maybe.map(get('MailingAddress')),
				Maybe.flatMap(Maybe.fromValue),
				Maybe.map(addressToDisplay),
				Maybe.orSome<React.ReactChild | null>(null)
			)(registry)}
		</div>
		<div
			style={{
				color: 'white'
			}}
			className="links"
		>
			<div className="links-right">
				<a href="#base" onClick={preventClick}>
					Top
				</a>
			</div>
		</div>
	</footer>
)) as React.FunctionComponent<FooterProps>;
