import type { Localized } from "./types";

/**
 * Practice questions for the driving licence written test, grouped from easy to hard; the mock exam mixes them.
 * Written from long-standing traffic rules in Nepal (drive on the left, lights, signs, helmets,
 * giving way, uphill right of way, emergency numbers 100/102). They are practice, not the official
 * question bank; the page says so. `sign` draws a road sign with the question (see RoadSign).
 */

export type Level = "easy" | "medium" | "hard";

export type SignName = "stop" | "giveWay" | "noEntry" | "noHorn" | "noOvertaking" | "speed40" | "school" | "turnLeft" | "curve" | "pedestrian";

export interface QuizQuestion {
  q: Localized;
  options: Localized[];
  /** Index of the right option. */
  answer: number;
  why: Localized;
  sign?: SignName;
}

const o = (ne: string, en: string): Localized => ({ ne, en });

export const QUIZ: Record<Level, QuizQuestion[]> = {
  easy: [
    {
      q: o("नेपालमा सवारी सडकको कुन भागबाट चलाउनुपर्छ?", "Which side of the road do you drive on in Nepal?"),
      options: [o("बायाँ", "Left"), o("दायाँ", "Right"), o("बीचमा", "Middle"), o("जहाँ खाली छ", "Wherever is free")],
      answer: 0,
      why: o("नेपालमा सबै सवारी सडकको बायाँ भागबाट चलाउनुपर्छ।", "In Nepal all vehicles keep to the left."),
    },
    {
      q: o("ट्राफिक बत्तीमा रातो बत्ती बल्दा के गर्ने?", "What should you do at a red traffic light?"),
      options: [o("रोकिने", "Stop"), o("बिस्तारै अघि बढ्ने", "Go slowly"), o("हर्न बजाउँदै जाने", "Go, sounding the horn"), o("दायाँ मोड्ने", "Turn right")],
      answer: 0,
      why: o("रातो बत्ती बल्दा रेखाभन्दा अघि रोकिनुपर्छ।", "Red means stop before the line."),
    },
    {
      q: o("पहेँलो बत्ती बल्दा के गर्ने?", "What does an amber (yellow) light mean?"),
      options: [o("रोकिने तयारी गर्ने", "Get ready to stop"), o("छिटो पार गर्ने", "Speed up and cross"), o("पछाडि फर्कने", "Reverse"), o("हर्न बजाउने", "Sound the horn")],
      answer: 0,
      why: o("पहेँलो बत्तीले रातो बत्ती आउँदैछ भन्छ; सुरक्षित भए रोकिनुपर्छ।", "Amber warns that red is coming; stop if it is safe to."),
    },
    {
      q: o("हरियो बत्ती बल्दा के गर्न सकिन्छ?", "What may you do at a green light?"),
      options: [o("बाटो खाली भए अघि बढ्न", "Go on if the way is clear"), o("जसरी पनि छिटो जान", "Go fast no matter what"), o("रोकिन", "Stop"), o("पार्किङ गर्न", "Park")],
      answer: 0,
      why: o("हरियो बत्तीमा पनि पैदल यात्री र अरू सवारी हेरेर मात्र अघि बढ्नुपर्छ।", "Even on green, go only when pedestrians and traffic are clear."),
    },
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("पूर्ण रूपमा रोकिनुहोस्", "Stop completely"), o("बिस्तारै जानुहोस्", "Slow down"), o("पार्किङ", "Parking"), o("अस्पताल", "Hospital")],
      answer: 0,
      why: o("रातो अठकुने चिह्नले पूर्ण रूपमा रोकिन भन्छ।", "The red eight-sided sign means stop completely."),
      sign: "stop",
    },
    {
      q: o("मोटरसाइकलमा हेल्मेट कसले लगाउनुपर्छ?", "Who must wear a helmet on a motorcycle?"),
      options: [o("चालक र पछाडि बस्ने दुवै", "Both rider and pillion"), o("चालक मात्र", "Only the rider"), o("पछाडि बस्ने मात्र", "Only the pillion"), o("लामो यात्रामा मात्र", "Only on long trips")],
      answer: 0,
      why: o("चालक र पछाडि बस्ने दुवैले हेल्मेट लगाउनुपर्छ।", "Both the rider and the pillion must wear helmets."),
    },
    {
      q: o("सवारी चलाउँदा मोबाइल फोन प्रयोग गर्न मिल्छ?", "May you use a mobile phone while driving?"),
      options: [o("मिल्दैन", "No"), o("छोटो कुरा मात्र", "Only short calls"), o("रातमा मात्र", "Only at night"), o("खाली बाटोमा मिल्छ", "Yes, on empty roads")],
      answer: 0,
      why: o("चलाउँदा फोन प्रयोग गर्दा ध्यान बाँडिन्छ र दुर्घटना हुन सक्छ।", "Using a phone distracts you and causes crashes."),
    },
    {
      q: o("जेब्रा क्रसिङमा पैदल यात्री पर्खिरहेका छन् भने के गर्ने?", "Pedestrians are waiting at a zebra crossing. What do you do?"),
      options: [o("रोकेर बाटो दिने", "Stop and let them cross"), o("हर्न बजाएर अघि बढ्ने", "Sound the horn and go"), o("छिटो पार गर्ने", "Cross quickly"), o("दायाँबाट छल्ने", "Swerve around them")],
      answer: 0,
      why: o("जेब्रा क्रसिङमा पैदल यात्रीलाई पहिले बाटो दिनुपर्छ।", "Pedestrians on a zebra crossing go first."),
      sign: "pedestrian",
    },
    {
      q: o("मदिरा सेवन गरेर सवारी चलाउन मिल्छ?", "May you drive after drinking alcohol?"),
      options: [o("पटक्कै मिल्दैन", "Never"), o("थोरै भए मिल्छ", "A little is fine"), o("रातमा मिल्छ", "At night it's fine"), o("छोटो दूरीमा मिल्छ", "For short trips")],
      answer: 0,
      why: o("मदिरा सेवन गरेर सवारी चलाउनु दण्डनीय छ।", "Drink-driving is an offence."),
    },
    {
      q: o("पछाडिबाट साइरन बजाउँदै एम्बुलेन्स आउँदा के गर्ने?", "An ambulance with its siren on comes up behind you. What do you do?"),
      options: [o("बायाँ लागेर बाटो दिने", "Move left and let it pass"), o("छिटो अघि बढ्ने", "Speed up"), o("बीच सडकमा रोकिने", "Stop in the middle"), o("हर्न बजाउने", "Sound the horn")],
      answer: 0,
      why: o("आपतकालीन सवारीलाई तुरुन्त बाटो दिनुपर्छ।", "Always let emergency vehicles through."),
    },
  ],
  medium: [
    {
      q: o("अगाडिको सवारीलाई कुन तर्फबाट उछिन्नुपर्छ?", "Which side do you overtake the vehicle ahead from?"),
      options: [o("दायाँ तर्फबाट", "From the right"), o("बायाँ तर्फबाट", "From the left"), o("जुनसुकै तर्फबाट", "Either side"), o("उछिन्नै हुँदैन", "Never overtake")],
      answer: 0,
      why: o("बायाँ लागेर चलाउने नेपालमा उछिन्दा दायाँ तर्फबाट उछिन्नुपर्छ।", "Since Nepal drives on the left, you overtake on the right."),
    },
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("हर्न बजाउन निषेध", "No horn"), o("हर्न बजाउनुहोस्", "Sound the horn"), o("सङ्गीत बजाउन मिल्छ", "Music allowed"), o("अस्पताल नजिक", "Hospital near")],
      answer: 0,
      why: o("रातो घेराभित्र काटिएको हर्नले हर्न बजाउन निषेध गर्छ।", "A crossed-out horn in a red circle means no horn."),
      sign: "noHorn",
    },
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("प्रवेश निषेध", "No entry"), o("एकतर्फी बाटो", "One-way road"), o("पार्किङ", "Parking"), o("सडक बन्द छैन", "Road open")],
      answer: 0,
      why: o("रातो गोलोमा सेतो धर्साले त्यता प्रवेश गर्न निषेध गर्छ।", "A red circle with a white bar means no entry."),
      sign: "noEntry",
    },
    {
      q: o("यो चिह्न देख्दा के गर्ने?", "What should you do at this sign?"),
      options: [o("अरूलाई बाटो दिने", "Give way to others"), o("छिटो जाने", "Speed up"), o("हर्न बजाउने", "Sound the horn"), o("पार्क गर्ने", "Park")],
      answer: 0,
      why: o("उल्टो त्रिकोणले मूल सडकका सवारीलाई बाटो दिन भन्छ।", "The upside-down triangle means give way to traffic on the main road."),
      sign: "giveWay",
    },
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("अगाडि विद्यालय, बालबालिका", "School and children ahead"), o("खेल मैदान", "Playground"), o("पैदल यात्री निषेध", "No pedestrians"), o("बस बिसौनी", "Bus stop")],
      answer: 0,
      why: o("यो चेतावनी चिह्नले अगाडि बालबालिका हुन सक्ने भएकाले बिस्तारै चलाउन भन्छ।", "This warning sign means children may be ahead; slow down."),
      sign: "school",
    },
    {
      q: o("नीलो गोलोमा बायाँ फर्केको तीरले के भन्छ?", "What does a blue circle with a left arrow tell you?"),
      options: [o("बायाँ मात्र मोडिनुपर्छ", "You must turn left"), o("बायाँ मोडिन निषेध", "No left turn"), o("दायाँ मोडिनुपर्छ", "Turn right"), o("सिधा जानुपर्छ", "Go straight")],
      answer: 0,
      why: o("नीलो गोलो चिह्नले पालना गर्नैपर्ने निर्देशन दिन्छ।", "Blue circles give instructions you must follow."),
      sign: "turnLeft",
    },
    {
      q: o("कार (B वर्ग) को लाइसेन्सका लागि कम्तीमा कति उमेर पुगेको हुनुपर्छ?", "What is the minimum age for a car (category B) licence?"),
      options: [o("१८ वर्ष", "18 years"), o("१६ वर्ष", "16 years"), o("२१ वर्ष", "21 years"), o("२५ वर्ष", "25 years")],
      answer: 0,
      why: o("कार, जिप, भ्यान (B वर्ग) का लागि १८ वर्ष पूरा भएको हुनुपर्छ।", "Car, jeep and van (category B) need 18 years completed."),
    },
    {
      q: o("घुम्ती (राउन्डअबाउट) मा पुग्दा कसलाई बाटो दिनुपर्छ?", "At a roundabout, who do you give way to?"),
      options: [o("घुम्तीभित्र पहिले नै रहेका सवारीलाई", "Vehicles already in the roundabout"), o("कसैलाई पनि होइन", "No one"), o("पछाडिका सवारीलाई", "Vehicles behind you"), o("सानो सवारीलाई मात्र", "Only small vehicles")],
      answer: 0,
      why: o("घुम्तीभित्र पहिले नै घुमिरहेका सवारीलाई पहिले जान दिनुपर्छ।", "Traffic already going round has priority."),
    },
    {
      q: o("अगाडिको सवारीसँग कति दूरी राख्नुपर्छ?", "How far behind the vehicle ahead should you stay?"),
      options: [o("अचानक रोकिँदा सुरक्षित रोकिन सकिने जति", "Enough to stop safely if it brakes"), o("एकदम नजिक", "Very close"), o("एक मिटर", "One metre"), o("दूरी चाहिँदैन", "No gap needed")],
      answer: 0,
      why: o("कम्तीमा दुई सेकेन्डको दूरी राख्दा सुरक्षित रोकिन सकिन्छ।", "Keeping at least a two-second gap lets you stop safely."),
    },
    {
      q: o("पानी परेको चिप्लो सडकमा के गर्ने?", "On a wet, slippery road, what should you do?"),
      options: [o("गति घटाउने, दूरी बढाउने", "Slow down and leave more space"), o("गति बढाउने", "Speed up"), o("अचानक ब्रेक लगाउने", "Brake suddenly"), o("बत्ती निभाउने", "Turn lights off")],
      answer: 0,
      why: o("चिप्लो सडकमा रोकिन बढी दूरी लाग्छ, त्यसैले बिस्तारै चलाउनुपर्छ।", "Stopping takes longer on wet roads, so drive slower."),
    },
    {
      q: o("ब्रेक लाइट किन चाहिन्छ?", "Why do vehicles have brake lights?"),
      options: [o("पछाडिकालाई गति घटाउँदैछु भनेर देखाउन", "To show those behind that you are slowing"), o("रातमा बाटो देख्न", "To see the road at night"), o("सजावटका लागि", "For decoration"), o("हर्नको सट्टा", "Instead of the horn")],
      answer: 0,
      why: o("ब्रेक लाइटले पछाडिको चालकलाई समयमै रोकिन सजग गराउँछ।", "Brake lights warn the driver behind to slow in time."),
    },
    {
      q: o("टायरमा हावा कम हुँदा के हुन्छ?", "What happens when tyre pressure is low?"),
      options: [o("सवारी नियन्त्रण कठिन र इन्धन बढी खर्च", "Harder to control and uses more fuel"), o("सवारी छिटो चल्छ", "The vehicle goes faster"), o("केही फरक पर्दैन", "No difference"), o("ब्रेक राम्रो लाग्छ", "Brakes work better")],
      answer: 0,
      why: o("सही हावा भएमा टायर सुरक्षित र किफायती हुन्छ; नियमित जाँच गर्नुहोस्।", "Correct pressure keeps tyres safe and economical; check it often."),
    },
    {
      q: o("जाममा धेरै बेर पर्खनुपर्दा के गर्नु राम्रो हुन्छ?", "When waiting a long time in a jam, what is best?"),
      options: [o("इन्जिन बन्द गर्ने", "Switch the engine off"), o("इन्जिन घुमाइरहने", "Keep revving the engine"), o("हर्न बजाइरहने", "Keep sounding the horn"), o("अर्को लेनमा घुस्ने", "Push into another lane")],
      answer: 0,
      why: o("इन्जिन बन्द गर्दा इन्धन बच्छ र वायु प्रदूषण घट्छ।", "Switching off saves fuel and cuts air pollution."),
    },
  ],
  hard: [
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("उछिन्न निषेध", "No overtaking"), o("दुई लेनको सडक", "Two-lane road"), o("कार पार्किङ", "Car parking"), o("कार धुने ठाउँ", "Car wash")],
      answer: 0,
      why: o("रातो घेराभित्र दुई कारको चिह्नले उछिन्न निषेध गर्छ।", "Two cars in a red circle mean no overtaking."),
      sign: "noOvertaking",
    },
    {
      q: o("यो चिह्नले के भन्छ?", "What does this sign tell you?"),
      options: [o("अधिकतम गति ४० कि.मि. प्रति घण्टा", "Maximum speed 40 km/h"), o("न्यूनतम गति ४०", "Minimum speed 40"), o("४० मिटर अगाडि मोड", "Bend in 40 m"), o("४० टन तौल", "40 tonnes weight")],
      answer: 0,
      why: o("रातो घेराभित्रको अङ्कले बढीमा त्यति गतिमा चलाउन भन्छ।", "A number in a red circle is the speed limit."),
      sign: "speed40",
    },
    {
      q: o("यो चिह्नको अर्थ के हो?", "What does this sign mean?"),
      options: [o("अगाडि खतरनाक मोड", "Dangerous bend ahead"), o("बाटो बन्द", "Road closed"), o("दायाँ मोडिन निषेध", "No right turn"), o("सिधा सडक", "Straight road")],
      answer: 0,
      why: o("त्रिकोण चेतावनी चिह्न हो; यसले अगाडि मोड छ भन्छ, गति घटाउनुहोस्।", "A triangle is a warning; this one warns of a bend, so slow down."),
      sign: "curve",
    },
    {
      q: o("साँघुरो पहाडी बाटोमा दुई सवारी जुध्ने अवस्थामा कसले बाटो दिनुपर्छ?", "On a narrow hill road, which vehicle should give way?"),
      options: [o("ओरालो झर्ने सवारीले", "The one going downhill"), o("उकालो चढ्ने सवारीले", "The one going uphill"), o("ठूलो सवारीले", "The bigger one"), o("जसले पहिले हर्न बजाउँछ", "Whoever honks first")],
      answer: 0,
      why: o("उकालो चढ्ने सवारीलाई रोकिएर फेरि चढ्न गाह्रो हुने भएकाले ओरालो झर्नेले बाटो दिनुपर्छ।", "Uphill vehicles struggle to restart, so the downhill one gives way."),
    },
    {
      q: o("लामो ओरालोमा ब्रेक मात्र प्रयोग गर्दा के हुन सक्छ?", "What can happen if you use only the brakes on a long downhill?"),
      options: [o("ब्रेक तातेर कमजोर हुन सक्छ; तल्लो गियर प्रयोग गर्ने", "Brakes overheat and weaken; use a low gear"), o("केही हुँदैन", "Nothing"), o("इन्धन बचत हुन्छ", "It saves fuel"), o("टायर बलियो हुन्छ", "Tyres get stronger")],
      answer: 0,
      why: o("ओरालोमा तल्लो गियरले इन्जिनबाटै गति नियन्त्रण गर्छ र ब्रेक जोगिन्छ।", "A low gear lets the engine hold your speed and saves the brakes."),
    },
    {
      q: o("रातमा अगाडिबाट सवारी आउँदा हेडलाइट कस्तो राख्ने?", "At night, with a vehicle coming towards you, how should your headlights be?"),
      options: [o("डिम (तल झारेर)", "Dipped (low beam)"), o("सबैभन्दा उज्यालो", "Full beam"), o("निभाएर", "Off"), o("बारम्बार बाल्दै निभाउँदै", "Flashing on and off")],
      answer: 0,
      why: o("उज्यालो बत्तीले अगाडिको चालकको आँखा तिरमिराउँछ, त्यसैले डिम गर्नुपर्छ।", "Full beam dazzles the other driver; dip your lights."),
    },
    {
      q: o("टायरको बुट्टा (ट्रेड) खिइयो भने के हुन्छ?", "What happens when tyre tread is worn out?"),
      options: [o("सडकमा पकड कम भई रोकिन धेरै दूरी लाग्छ", "Less grip; longer stopping distance"), o("गति बढ्छ", "You go faster"), o("इन्धन बचत हुन्छ", "It saves fuel"), o("केही फरक पर्दैन", "No difference")],
      answer: 0,
      why: o("खिइएको टायर चिप्लिन्छ, खास गरी पानी परेको सडकमा।", "Worn tyres slip, especially on wet roads."),
    },
    {
      q: o("नेपालमा प्रहरीलाई तुरुन्त खबर गर्ने नम्बर कुन हो?", "Which number calls the police in an emergency in Nepal?"),
      options: [o("१००", "100"), o("१०२", "102"), o("१०१", "101"), o("११११", "1111")],
      answer: 0,
      why: o("प्रहरी: १००, एम्बुलेन्स: १०२, दमकल: १०१।", "Police 100, ambulance 102, fire 101."),
    },
    {
      q: o("कहाँ सवारी पार्किङ गर्नु हुँदैन?", "Where must you not park?"),
      options: [o("जेब्रा क्रसिङ र चोकमा", "On a zebra crossing or at a junction"), o("तोकिएको पार्किङमा", "In a marked parking bay"), o("आफ्नो घरको आँगनमा", "In your own yard"), o("पेट्रोल पम्पको पार्किङमा", "In a fuel station's parking")],
      answer: 0,
      why: o("जेब्रा क्रसिङ र चोकमा पार्किङ गर्दा पैदल यात्री र अरू सवारीलाई बाधा र खतरा हुन्छ।", "Parking there blocks and endangers pedestrians and traffic."),
    },
    {
      q: o("ट्राफिक प्रहरीले हत्केला तपाईंतर्फ फर्काएर हात उठाए भने के गर्ने?", "A traffic officer raises a hand, palm towards you. What do you do?"),
      options: [o("रोकिने", "Stop"), o("अघि बढ्ने", "Go on"), o("दायाँ मोड्ने", "Turn right"), o("हर्न बजाउने", "Sound the horn")],
      answer: 0,
      why: o("ट्राफिक प्रहरीको हातको इसारा बत्तीभन्दा पनि पहिले मान्नुपर्छ।", "An officer's signal comes before the traffic lights."),
    },
    {
      q: o("इन्जिन तेल समयमै किन फेर्नुपर्छ?", "Why should engine oil be changed on time?"),
      options: [o("इन्जिनका पार्टपुर्जा चिल्लो र सुरक्षित राख्न", "To keep engine parts lubricated and protected"), o("रङ राम्रो देखाउन", "To improve the colour"), o("हर्न ठूलो बनाउन", "To make the horn louder"), o("टायर नयाँ राख्न", "To keep tyres new")],
      answer: 0,
      why: o("पुरानो तेलले इन्जिन खिइन्छ र तातिन्छ।", "Old oil lets the engine wear and overheat."),
    },
    {
      q: o("सवारीले कालो धुवाँ धेरै फाल्छ भने के गर्ने?", "Your vehicle gives off a lot of black smoke. What should you do?"),
      options: [o("मर्मत गराई प्रदूषण जाँच पास गराउने", "Have it repaired and pass the emission check"), o("बेवास्ता गर्ने", "Ignore it"), o("रातमा मात्र चलाउने", "Drive only at night"), o("छिटो चलाउने", "Drive faster")],
      answer: 0,
      why: o("धुवाँले वातावरण र स्वास्थ्यमा हानि गर्छ; प्रदूषण मापदण्ड पूरा गर्नुपर्छ।", "Smoke harms health and the environment; vehicles must meet emission rules."),
    },
    {
      q: o("दुर्घटनामा कोही घाइते भए पहिले के गर्ने?", "Someone is injured in a crash. What do you do first?"),
      options: [o("एम्बुलेन्स (१०२) र प्रहरी (१००) लाई खबर गर्ने", "Call an ambulance (102) and the police (100)"), o("घटनास्थलबाट भाग्ने", "Leave the scene"), o("फोटो खिच्ने मात्र", "Only take photos"), o("घाइतेलाई जबरजस्ती उठाउने", "Force the injured person to get up")],
      answer: 0,
      why: o("तुरुन्त सहयोग माग्नुहोस्; गम्भीर घाइतेलाई अनावश्यक नचलाउनुहोस्।", "Get help at once; don't move a badly injured person unless needed."),
    },
    {
      q: o("सवारी चलाउँदा साथमा कुन कागजात राख्नुपर्छ?", "Which documents must you carry while driving?"),
      options: [o("सवारी चालक अनुमतिपत्र र ब्लुबुक", "Driving licence and bluebook"), o("जन्मदर्ता मात्र", "Only a birth certificate"), o("कुनै पनि चाहिँदैन", "None"), o("विद्यालयको प्रमाणपत्र", "School certificate")],
      answer: 0,
      why: o("जाँचमा लाइसेन्स र सवारीको ब्लुबुक देखाउनुपर्छ।", "At a check you must show your licence and the vehicle's bluebook."),
    },
  ],
};

/**
 * The mock exam, set up like the computer test at transport offices as practice sites describe it:
 * 25 questions, 4 marks each, 60% (15 right) to pass, no minus marks, about 25 minutes.
 * Not an official figure; the page says to confirm with the office.
 */
export const EXAM = { questions: 25, minutes: 25, passCorrect: 15 };
