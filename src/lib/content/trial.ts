import type { Localized } from "./types";

/**
 * The driving licence trial (practical) test, station by station, as driving schools and guide
 * sites describe the marking sheet: 100 points, 70 to pass. Not an official DoTM document;
 * the order follows the official trial map used at transport offices. `scene` picks the animation for each station (TrialScene).
 */

export type TrialVehicle = "bike" | "car";
export type TrialScene = "figure8" | "plank" | "uturn" | "breaker" | "ramp" | "light" | "parking" | "behaviour";
/** The whole trial ground seen from above (not a station of its own). */
export type TrialView = TrialScene | "drone";

export interface TrialStation {
  scene: TrialScene;
  title: Localized;
  points: number;
  /** Mistakes that cost points: [what, how many points]. */
  minus: [Localized, number][];
  /** Mistakes that fail the whole trial at once. */
  fail: Localized[];
}

const o = (ne: string, en: string): Localized => ({ ne, en });

export const TRIAL_PASS = 70;

const figure8 = (vehicle: TrialVehicle): TrialStation => ({
  scene: "figure8",
  title: o("आठ (८) आकारको घुम्ती", "Figure of eight"),
  points: 20,
  minus:
    vehicle === "bike"
      ? [[o("पहेँलो रेखा एक पटक छोएमा", "Touching the yellow line once"), 5], [o("एक पटक खुट्टा भुइँमा राखेमा", "Putting a foot down once"), 5]]
      : [[o("पहेँलो रेखा छोएमा (प्रति पटक, दुई पटकसम्म)", "Touching the yellow line (each time, up to twice)"), 5]],
  fail:
    vehicle === "bike"
      ? [o("रेखा दुई पटक छोएमा", "Touching the line twice"), o("दुई पटक खुट्टा राखेमा", "Putting a foot down twice"), o("पाङ्ग्रा रेखाबाहिर पूरै गएमा", "A wheel fully outside the line"), o("गलत दिशाबाट छिरेमा", "Entering from the wrong side"), o("इन्जिन बन्द भएमा", "The engine stalling")]
      : [o("रेखा दुई पटकभन्दा बढी छोएमा", "Touching the line more than twice"), o("टायर लेनबाहिर पूरै गएमा", "A tyre fully out of the lane"), o("गलत दिशाबाट छिरेमा", "Entering from the wrong side"), o("कुनै पनि बेला पछाडि सारेमा", "Reversing at any point")],
});

const uturn: TrialStation = {
  scene: "uturn",
  title: o("यू-टर्न", "U-turn"),
  points: 10,
  minus: [[o("इन्डिकेटर नदिएमा", "Not using the indicator"), 10]],
  fail: [o("सीमा रेखा छोएमा", "Touching the boundary line")],
};

const light: TrialStation = {
  scene: "light",
  title: o("ट्राफिक बत्ती", "Traffic light"),
  points: 15,
  minus: [[o("बत्तीको सङ्केत नमानेमा", "Not obeying the signal"), 15]],
  fail: [],
};

export const TRIAL: Record<TrialVehicle, TrialStation[]> = {
  bike: [
    figure8("bike"),
    {
      scene: "plank",
      title: o("साँघुरो बाटो", "Narrow path"),
      points: 10,
      minus: [],
      fail: [o("खुट्टा भुइँमा राखेमा", "Putting a foot down"), o("तख्ताबाट झरेमा", "Riding off the plank")],
    },
    uturn,
    {
      scene: "breaker",
      title: o("स्पिड ब्रेकर", "Speed breaker"),
      points: 15,
      minus: [[o("एक पटक खुट्टा राखेमा", "Putting a foot down once"), 5], [o("एक पटक इन्जिन बन्द भएमा", "Stalling once"), 5]],
      fail: [o("एकभन्दा बढी पटक खुट्टा राखेमा", "Putting a foot down more than once"), o("एकभन्दा बढी पटक इन्जिन बन्द भएमा", "Stalling more than once")],
    },
    light,
    {
      scene: "ramp",
      title: o("उकालो (र्‍याम्प)", "Ramp (hill start)"),
      points: 20,
      minus: [],
      fail: [o("६ इन्चभन्दा बढी पछाडि गुडेमा", "Rolling back more than 6 inches"), o("सीमा रेखा नाघेमा", "Crossing the boundary"), o("एकभन्दा बढी पटक इन्जिन बन्द भएमा", "Stalling more than once"), o("सङ्केतअघि नै हिँडेमा", "Moving before the signal")],
    },
    {
      scene: "behaviour",
      title: o("चलाउने बानी", "Riding behaviour"),
      points: 10,
      minus: [[o("चढ्नुअघि जाँच नगरेमा", "No check before riding"), 3], [o("हेल्मेट लक नगरेमा", "Helmet strap not locked"), 4], [o("जथाभावी चलाएमा", "Rough riding"), 3]],
      fail: [],
    },
  ],
  car: [
    figure8("car"),
    {
      scene: "breaker",
      title: o("स्पिड ब्रेकर", "Speed breaker"),
      points: 10,
      minus: [[o("एक पटक इन्जिन बन्द भएमा", "Stalling once"), 5]],
      fail: [o("दुई पटक इन्जिन बन्द भएमा", "Stalling twice")],
    },
    uturn,
    light,
    {
      scene: "ramp",
      title: o("उकालो (र्‍याम्प)", "Ramp (hill start)"),
      points: 15,
      minus: [],
      fail: [o("रेखाबीच नरोकिएमा", "Not stopping between the lines"), o("एकभन्दा बढी पटक इन्जिन बन्द भएमा", "Stalling more than once"), o("६ इन्चभन्दा बढी पछाडि गुडेमा", "Rolling back more than 6 inches"), o("सङ्केतअघि नै हिँडेमा", "Moving before the signal")],
    },
    {
      scene: "parking",
      title: o("ग्यारेज पार्किङ (L-ब्याक)", "Garage parking (L-back)"),
      points: 20,
      minus: [[o("एक पटक अगाडि सारेर मिलाएमा", "One forward correction"), 10]],
      fail: [o("सीमा रेखा वा कोन छोएमा", "Touching the boundary or cones"), o("एकभन्दा बढी पटक अगाडि सारेमा", "More than one forward correction")],
    },
    {
      scene: "behaviour",
      title: o("चलाउने बानी", "Driving behaviour"),
      points: 10,
      minus: [[o("चलाउनुअघि जाँच नगरेमा", "No check before driving"), 3], [o("सिटबेल्ट नलगाएमा", "No seatbelt"), 4], [o("जथाभावी चलाएमा", "Rough driving"), 3]],
      fail: [],
    },
  ],
};
