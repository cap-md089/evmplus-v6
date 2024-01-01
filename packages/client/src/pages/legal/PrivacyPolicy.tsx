import * as React from 'react';

const lineHeight = {
	lineHeight: '1.6em',
} as const;

export const PrivacyPolicy = (): JSX.Element => (
	<div style={lineHeight}>
		<h2>Welcome to Event Manager</h2>
		<h3>Your privacy is critically important to us.</h3>
		<br />
		<p>
			It is Event Manager's policy to respect your privacy regarding any information we may
			collect while operating our website. This Privacy Policy applies to Event Manager
			(hereinafter, "us", "we", or "Event Manager"). We respect your privacy and are committed
			to protecting personally identifiable information stored on our system. We have adopted
			this privacy policy ("Privacy Policy") to explain what information may be present on our
			Website, how we use this information, and under what circumstances we may disclose the
			information to third parties. This Privacy Policy applies to information we collect
			through the Website and to information downloaded from eServices via CAPWATCH file
			download and import actions by those authorized to do so.
		</p>
		<p>
			This Privacy Policy, together with the Terms and conditions posted on our Website, set
			forth the general rules and policies governing your use of our Website. Depending on
			your activities when visiting our Website, you may be required to agree to additional
			terms and conditions.
		</p>
		<h2>Website Visitors</h2>
		<p>
			Like most website operators, Event Manager may collect non-personally-identifying
			information of the sort that web browsers and servers typically make available, such as
			the browser type and the date and time of each visitor request. Event Manager's purpose in
			collecting non-personally identifying information is to better understand how
			Event Manager's visitors use its website. From time to time, Event Manager may release
			non-personally-identifying information in the aggregate, e.g., by publishing a report on
			trends in the usage of its website.
		</p>
		<p>
			Event Manager may also collect potentially personally-identifying information like CAPID
			and Internet Protocol (IP) addresses for logged in users. Event Manager only discloses
			logged in user and commenter IP addresses under the same circumstances that it uses and
			discloses personally-identifying information as described below.
		</p>
		<h2>Gathering of Personally-Identifying Information</h2>
		<p>
			Certain visitors to Event Manager's websites choose to interact with Event Manager in ways
			that require Event Manager to gather personally-identifying information. The amount and
			type of information that Event Manager gathers depends on the nature of the interaction.
			For example, in order to register for a user account we ask for CAPID and email address
			to verify current CAP membership.
		</p>
		<h2>Security</h2>
		<p>
			The security of your Personal Information is important to us, but remember that no
			method of transmission over the Internet, or method of electronic storage is 100%
			secure. While we strive to use commercially acceptable means to protect your Personal
			Information, we cannot guarantee its absolute security.
		</p>
		<h2>Links To External Sites</h2>
		<p>
			Our Service may contain links to external sites that are not operated by us. If you
			click on a third party link, you will be directed to that third party's site. We
			strongly advise you to review the Privacy Policy and terms and conditions of every site
			you visit.
		</p>
		<p>
			We have no control over, and assume no responsibility for the content, privacy policies
			or practices of any third party sites, products or services.
		</p>
		<h2>Protection of Certain Personally-Identifying Information</h2>
		<p>
			Event Manager discloses potentially personally-identifying and personally-identifying
			information only to those of its developers and registered users that (i) need to know
			that information in order to carry out CAP missions, and (ii) that have agreed not to
			disclose it to others except in the performance of CAP missions. Event Manager will not
			rent or sell potentially personally-identifying and personally-identifying information
			to anyone. Other than to its developers and registered users as described above,
			Event Manager discloses potentially personally-identifying and personally-identifying
			information only in response to a subpoena, court order or other governmental request,
			or when Event Manager believes in good faith that disclosure is reasonably necessary to
			protect the property or rights of Event Manager, third parties or the public at large.
		</p>
		<p>
			If you are a registered user of Event Manager, we may occasionally send you an email to
			tell you about new features, solicit your feedback, or just keep you up to date with
			what's going on with Event Manager and our services. We expect to keep this type of email
			to a minimum. If you send us a request (for example via a support email or via one of
			our feedback mechanisms), we reserve the right to publish it in order to help us clarify
			or respond to your request or to help us support other users. Event Manager takes all
			measures reasonably necessary to protect against the unauthorized access, use,
			alteration or destruction of potentially personally-identifying and
			personally-identifying information.
		</p>
		<h2>Aggregated Statistics</h2>
		<p>
			Event Manager may collect statistics about the behavior of visitors to its website.
			Event Manager may display this information publicly or provide it to others. However,
			Event Manager does not disclose your personally-identifying information.
		</p>
		<h2>Cookies</h2>
		<p>
			To enrich and perfect your online experience, Event Manager uses "Cookies", similar
			technologies and services provided by others to display personalized content,
			appropriate advertising and store your preferences on your computer.
		</p>
		<p>
			A cookie is a string of information that a website stores on a visitor's computer, and
			that the visitor's browser provides to the website each time the visitor returns.
			Event Manager may use cookies to help Event Manager identify and track visitors, their usage
			of the site, and their website access preferences. Event Manager visitors who do not wish
			to have cookies placed on their computers should set their browsers to refuse cookies
			before using Event Manager's websites, with the drawback that certain features of
			Event Manager's websites may not function properly without the aid of cookies.
		</p>
		<p>
			By continuing to navigate our website without changing your cookie settings, you hereby
			acknowledge and agree to Event Manager's use of cookies.
		</p>
		<h2>Privacy Policy Changes</h2>
		<p>
			Although most changes are likely to be minor, Event Manager may change its Privacy Policy
			from time to time, and in Event Manager's sole discretion. Event Manager encourages visitors
			to frequently check this page for any changes to its Privacy Policy. Your continued use
			of this site after any change in this Privacy Policy will constitute your acceptance of
			such change.
		</p>
		<h2>Contact Information</h2>
		<p>
			If you have any questions about this Privacy Policy, please contact us at{' '}
			<a href="mailto:eventsupport@md.cap.gov">eventsupport@md.cap.gov</a>.
		</p>
	</div>
);

export default PrivacyPolicy;
