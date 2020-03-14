import * as React from 'react';
import Registry from '../../lib/Registry';
import './Footer.scss';
import { Maybe, fromValue } from 'common-lib';

interface FooterProps {
	registry: Maybe<Registry>;
}

const preventClick = (ev: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
	return false;
};

export default (({ registry }) => (
	<footer>
		<div className="contact">
			<div>
				<div className="footerBoxTitle">Connect With Us</div>
				<p>
					{registry
						.map(reg => [
							reg.Contact.FaceBook ? (
								<a
									href={`https://www.facebook.com/${reg.Contact.FaceBook}`}
									target="_blank"
									className="social-media fb"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.Twitter ? (
								<a
									href={`https://www.twitter.com/${reg.Contact.Twitter}`}
									target="_blank"
									className="social-media twitter"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.YouTube ? (
								<a
									href={`https://www.youtube.com/channel/${reg.Contact.YouTube}`}
									target="_blank"
									className="social-media youtube"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.LinkedIn ? (
								<a
									href={`https://in.linkedin.com/in/${reg.Contact.LinkedIn}`}
									target="_blank"
									className="social-media linkedin"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.Instagram ? (
								<a
									href={`https://www.instagram.com/${reg.Contact.Instagram}`}
									target="_blank"
									className="social-media instagram"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.Flickr ? (
								<a
									href={`https://www.flickr.com/photos/${reg.Contact.Flickr}`}
									target="_blank"
									className="social-media flickr"
									rel="noopener noreferrer"
								/>
							) : null,
							reg.Contact.Discord ? (
								<a
									href={`https://discord.gg/${reg.Contact.Discord}`}
									target="_blank"
									className="social-media discord"
									rel="noopener noreferrer"
								/>
							) : null
						])
						.orNull()}
				</p>
			</div>
			{registry
				.flatMap(reg => fromValue(reg.Contact.MeetingAddress))
				.map(({ Name, FirstLine, SecondLine }) => (
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
				))
				.orNull()}
			{registry
				.flatMap(reg => fromValue(reg.Contact.MailingAddress))
				.map(({ Name, FirstLine, SecondLine }) => (
					<div>
						<div className="footerBoxTitle">Mailing Address</div>
						<p>
							{Name}
							<br />
							{FirstLine}
							<br />
							{SecondLine}
						</p>
					</div>
				))
				.orNull()}
		</div>
		<div
			style={{
				color: 'white'
			}}
			className="links"
		>
			<div className="info-left">
				&copy; 2017-
				{new Date().getFullYear()} capunit.com
			</div>
			<div className="links-right">
				<a href="#base" onClick={preventClick}>
					Top
				</a>
			</div>
		</div>
	</footer>
)) as React.FunctionComponent<FooterProps>;
