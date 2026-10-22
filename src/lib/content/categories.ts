import type { Category } from "./types";

export const categories: Category[] = [
  { id: "identity", icon: "idcard", name: { ne: "परिचय र व्यक्तिगत कागजात", en: "Identity & personal documents" } },
  { id: "transport", icon: "car", name: { ne: "यातायात", en: "Transport" } },
  { id: "tax", icon: "receipt", name: { ne: "कर र व्यवसाय", en: "Tax & business" } },
  { id: "police", icon: "shield", name: { ne: "प्रहरी र कानुनी कागजात", en: "Police & legal documents" } },
  { id: "education", icon: "graduation", name: { ne: "शिक्षा र रोजगारी", en: "Education & employment" } },
  { id: "civic", icon: "vote", name: { ne: "मतदान र नागरिक सेवा", en: "Voting & civic services" } },
];
