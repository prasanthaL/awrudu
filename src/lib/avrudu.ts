export enum Gender {
    Male = "male",
    Female = "female",
}

export const SportsByGender: Record<Gender, readonly string[]> = {
    [Gender.Male]: [
        "අවුරුදු කුමරා (අවුරුදු 16ට වැඩි)",
        "අවුරුදු කුමරා (අවුරුදු 50ට අඩු)",
        "සිඟිති අවුරුදු කුමරා (අවුරුදු 10ට අඩු)",
        "බයිසිකල් රේස් (කළුතර දිස්ත්‍රික්කය)",
        "බයිසිකල් රේස් (701 / 701A ග්‍රාම නිලධාරී වසම)",
        "යුගල බයිසිකල් රේස් (701 / 701A ග්‍රාම නිලධාරී වසම)",
        "ගමහරහා දිවීම පිරිමි (විවෘත)",
        "කොට්ටා පොර පිරිමි (මොරොන්තුඩුව පොලිස් වසම)",
        "කඹ ඇදීම පිරිමි (මොරොන්තුඩුව පොලිස් වසම)",
    ],
    [Gender.Female]: [
        "අවුරුදු කුමරිය (අවුරුදු 16ට වැඩි)",
        "අවුරුදු කුමරිය (අවුරුදු 50ට අඩු)",
        "සිඟිති අවුරුදු කුමරිය (අවුරුදු 10ට අඩු)",
        "ගමහරහා දිවීම කාන්තා (විවෘත)",
        "කොට්ටා පොර කාන්තා (මොරොන්තුඩුව පොලිස් වසම)",
        "කඹ ඇදීම කාන්තා (මොරොන්තුඩුව පොලිස් වසම)",
    ],
} as const;

export type Participant = {
    id: string;
    name: string;
    age: number;
    gender: Gender;
    sport: string;
    address: string;
    dob: string;
    phone: string;
    nic: string;
    division: string;
    district: string;
    place?: string; // e.g. "1st", "2nd", "3rd"
    createdAt: string;
};
export function getAgeGroup(age: number) {
    if (age < 12) return "Under 12";
    if (age <= 18) return "12 - 18";
    return "Adults";
}
