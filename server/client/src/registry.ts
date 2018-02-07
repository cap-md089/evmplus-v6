export default interface Registry {
	Website: {
		Name: string,
		Separator: string
	};
	Contact: {
		FaceBook?: string
		Twitter?: string,
		YouTube?: string,
		LinkedIn?: string,
		Instagram?: string,
		Flickr?: string
		MeetingAddress?: {
			Name: string,
			FirstLine: string,
			SecondLine: string
		},
		MailingAddress?: {
			Name: string,
			FirstLine: string,
			SecondLine: string
		}
	};
}