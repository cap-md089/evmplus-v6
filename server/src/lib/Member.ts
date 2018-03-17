interface IMyMember {
    
}

export default class Member {
    /**
     * The username of the member, converted to a CAPID later
     */
    public username = 0;
    public capid = 0;

    public static Create (uname: string, pass: string): Promise<Member> {

        return null;
    }

    public static Check (cookie: string): Promise<Member> {

        return null;
    }

    public static Estimate (capid: number): Promise<Member> {

        return null;
    }
    
    private constructor (data: IMyMember) {

    }
}