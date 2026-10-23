import type { Localized } from "./types";

/**
 * Nepal's 77 districts, by province (as named after the 2015 constitution).
 * `aliases` are other spellings map data uses, so a location can be matched to its district.
 */
export interface District {
  en: string;
  ne: string;
  province: Localized;
  aliases?: string[];
}

const P = {
  koshi: { ne: "कोशी प्रदेश", en: "Koshi Province" },
  madhesh: { ne: "मधेश प्रदेश", en: "Madhesh Province" },
  bagmati: { ne: "बागमती प्रदेश", en: "Bagmati Province" },
  gandaki: { ne: "गण्डकी प्रदेश", en: "Gandaki Province" },
  lumbini: { ne: "लुम्बिनी प्रदेश", en: "Lumbini Province" },
  karnali: { ne: "कर्णाली प्रदेश", en: "Karnali Province" },
  sudurpashchim: { ne: "सुदूरपश्चिम प्रदेश", en: "Sudurpashchim Province" },
};

export const DISTRICTS: District[] = [
  { en: "Taplejung", ne: "ताप्लेजुङ", province: P.koshi },
  { en: "Panchthar", ne: "पाँचथर", province: P.koshi },
  { en: "Ilam", ne: "इलाम", province: P.koshi },
  { en: "Jhapa", ne: "झापा", province: P.koshi },
  { en: "Morang", ne: "मोरङ", province: P.koshi },
  { en: "Sunsari", ne: "सुनसरी", province: P.koshi },
  { en: "Dhankuta", ne: "धनकुटा", province: P.koshi },
  { en: "Terhathum", ne: "तेह्रथुम", province: P.koshi, aliases: ["Tehrathum"] },
  { en: "Sankhuwasabha", ne: "संखुवासभा", province: P.koshi },
  { en: "Bhojpur", ne: "भोजपुर", province: P.koshi },
  { en: "Solukhumbu", ne: "सोलुखुम्बु", province: P.koshi },
  { en: "Okhaldhunga", ne: "ओखलढुङ्गा", province: P.koshi },
  { en: "Khotang", ne: "खोटाङ", province: P.koshi },
  { en: "Udayapur", ne: "उदयपुर", province: P.koshi },

  { en: "Saptari", ne: "सप्तरी", province: P.madhesh },
  { en: "Siraha", ne: "सिराहा", province: P.madhesh },
  { en: "Dhanusha", ne: "धनुषा", province: P.madhesh, aliases: ["Dhanusa"] },
  { en: "Mahottari", ne: "महोत्तरी", province: P.madhesh },
  { en: "Sarlahi", ne: "सर्लाही", province: P.madhesh },
  { en: "Bara", ne: "बारा", province: P.madhesh },
  { en: "Parsa", ne: "पर्सा", province: P.madhesh },
  { en: "Rautahat", ne: "रौतहट", province: P.madhesh },

  { en: "Sindhuli", ne: "सिन्धुली", province: P.bagmati },
  { en: "Ramechhap", ne: "रामेछाप", province: P.bagmati },
  { en: "Dolakha", ne: "दोलखा", province: P.bagmati },
  { en: "Sindhupalchok", ne: "सिन्धुपाल्चोक", province: P.bagmati, aliases: ["Sindhupalchowk"] },
  { en: "Kavrepalanchok", ne: "काभ्रेपलाञ्चोक", province: P.bagmati, aliases: ["Kabhrepalanchok", "Kavre"] },
  { en: "Lalitpur", ne: "ललितपुर", province: P.bagmati },
  { en: "Bhaktapur", ne: "भक्तपुर", province: P.bagmati },
  { en: "Kathmandu", ne: "काठमाडौं", province: P.bagmati },
  { en: "Nuwakot", ne: "नुवाकोट", province: P.bagmati },
  { en: "Rasuwa", ne: "रसुवा", province: P.bagmati },
  { en: "Dhading", ne: "धादिङ", province: P.bagmati },
  { en: "Makwanpur", ne: "मकवानपुर", province: P.bagmati, aliases: ["Makawanpur"] },
  { en: "Chitwan", ne: "चितवन", province: P.bagmati },

  { en: "Gorkha", ne: "गोरखा", province: P.gandaki },
  { en: "Lamjung", ne: "लमजुङ", province: P.gandaki },
  { en: "Tanahun", ne: "तनहुँ", province: P.gandaki, aliases: ["Tanahu"] },
  { en: "Syangja", ne: "स्याङ्जा", province: P.gandaki },
  { en: "Kaski", ne: "कास्की", province: P.gandaki },
  { en: "Manang", ne: "मनाङ", province: P.gandaki },
  { en: "Mustang", ne: "मुस्ताङ", province: P.gandaki },
  { en: "Myagdi", ne: "म्याग्दी", province: P.gandaki },
  { en: "Parbat", ne: "पर्वत", province: P.gandaki },
  { en: "Baglung", ne: "बागलुङ", province: P.gandaki },
  { en: "Nawalpur", ne: "नवलपुर", province: P.gandaki, aliases: ["Nawalparasi East", "Nawalparasi (East of Bardaghat Susta)"] },

  { en: "Parasi", ne: "परासी", province: P.lumbini, aliases: ["Nawalparasi West", "Nawalparasi (West of Bardaghat Susta)"] },
  { en: "Rupandehi", ne: "रुपन्देही", province: P.lumbini },
  { en: "Kapilvastu", ne: "कपिलवस्तु", province: P.lumbini, aliases: ["Kapilbastu"] },
  { en: "Palpa", ne: "पाल्पा", province: P.lumbini },
  { en: "Arghakhanchi", ne: "अर्घाखाँची", province: P.lumbini },
  { en: "Gulmi", ne: "गुल्मी", province: P.lumbini },
  { en: "Rukum East", ne: "पूर्वी रुकुम", province: P.lumbini, aliases: ["Eastern Rukum"] },
  { en: "Rolpa", ne: "रोल्पा", province: P.lumbini },
  { en: "Pyuthan", ne: "प्युठान", province: P.lumbini },
  { en: "Dang", ne: "दाङ", province: P.lumbini },
  { en: "Banke", ne: "बाँके", province: P.lumbini },
  { en: "Bardiya", ne: "बर्दिया", province: P.lumbini },

  { en: "Rukum West", ne: "पश्चिमी रुकुम", province: P.karnali, aliases: ["Western Rukum"] },
  { en: "Salyan", ne: "सल्यान", province: P.karnali },
  { en: "Dolpa", ne: "डोल्पा", province: P.karnali },
  { en: "Humla", ne: "हुम्ला", province: P.karnali },
  { en: "Jumla", ne: "जुम्ला", province: P.karnali },
  { en: "Kalikot", ne: "कालिकोट", province: P.karnali },
  { en: "Mugu", ne: "मुगु", province: P.karnali },
  { en: "Surkhet", ne: "सुर्खेत", province: P.karnali },
  { en: "Dailekh", ne: "दैलेख", province: P.karnali },
  { en: "Jajarkot", ne: "जाजरकोट", province: P.karnali },

  { en: "Bajura", ne: "बाजुरा", province: P.sudurpashchim },
  { en: "Bajhang", ne: "बझाङ", province: P.sudurpashchim },
  { en: "Achham", ne: "अछाम", province: P.sudurpashchim },
  { en: "Doti", ne: "डोटी", province: P.sudurpashchim },
  { en: "Kailali", ne: "कैलाली", province: P.sudurpashchim },
  { en: "Kanchanpur", ne: "कञ्चनपुर", province: P.sudurpashchim },
  { en: "Dadeldhura", ne: "डडेल्धुरा", province: P.sudurpashchim },
  { en: "Baitadi", ne: "बैतडी", province: P.sudurpashchim },
  { en: "Darchula", ne: "दार्चुला", province: P.sudurpashchim },
];

const squash = (s: string) => s.toLowerCase().replace(/district|जिल्ला/g, "").replace(/[^a-zऀ-ॿ]/g, "");

/** The district a map name refers to ("Rupandehi", "Kabhrepalanchok", "झापा जिल्ला"…), if any. */
export function findDistrict(name: string): District | undefined {
  const n = squash(name);
  if (!n) return undefined;
  return DISTRICTS.find((d) => [d.en, d.ne, ...(d.aliases ?? [])].some((x) => squash(x) === n));
}
