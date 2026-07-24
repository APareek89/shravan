export type ScamRisk = "LOW" | "SUSPICIOUS" | "HIGH";

const suspiciousPatterns = [
  /digital\s*arrest/i,
  /डिजिटल\s*अरेस्ट/i,
  /\bkyc\b.*(?:expire|block|update)/i,
  /otp|ओटीपी/i,
  /lottery|लॉटरी|इनाम/i,
  /electricity.*(?:disconnect|कट)/i,
  /courier|parcel|fedex|customs|कूरियर|पार्सल|कस्टम/i,
  /\btrai\b/i,
  /video\s*call.*police|police.*video\s*call/i,
];

const urgencyPatterns = [
  /police|पुलिस|case|केस|arrest|गिरफ्तार/i,
  /call|phone|number|फ़ोन|फोन|नंबर/i,
  /transfer|pay|payment|पैसे|रुपये|भुगतान/i,
  /immediately|urgent|अभी|तुरंत|आज ही/i,
  /otp|pin|cvv|ओटीपी/i,
];

const distressPatterns = [
  /self[\s-]?harm|suicide|kill myself/i,
  /खुदकुशी|आत्महत्या|मर जाना/i,
  /chest pain|pain in (?:my )?chest|सीने में दर्द|छाती में दर्द/i,
  /(?:i |मैं )?(?:have )?fell|i have fallen|गिर गया|गिर गई|गिर पड़ी/i,
  /can'?t breathe|सांस नहीं|साँस नहीं/i,
  /unconscious|बेहोश/i,
];

export function scamRuleRisk(message: string): ScamRisk {
  const suspiciousHits = suspiciousPatterns.filter((pattern) => pattern.test(message)).length;
  const urgencyHits = urgencyPatterns.filter((pattern) => pattern.test(message)).length;
  if (suspiciousHits >= 2 || (suspiciousHits >= 1 && urgencyHits >= 2)) return "HIGH";
  if (suspiciousHits >= 1 || urgencyHits >= 2) return "SUSPICIOUS";
  return "LOW";
}

export function maxRisk(a: ScamRisk, b: ScamRisk): ScamRisk {
  const order: Record<ScamRisk, number> = { LOW: 0, SUSPICIOUS: 1, HIGH: 2 };
  return order[a] >= order[b] ? a : b;
}

export function containsDistress(message: string) {
  return distressPatterns.some((pattern) => pattern.test(message));
}

export function canUseScamModel(checksToday: number, dailyLimit: number) {
  return checksToday < dailyLimit;
}

export const DISTRESS_RESPONSE_HI =
  "मुझे चिंता हो रही है। मैं डॉक्टर नहीं हूँ। कृपया अभी अपने Guardian या किसी पास के भरोसेमंद व्यक्ति को फ़ोन करें। अगर सीने में दर्द, गिरना, साँस की तकलीफ़ या तुरंत खतरा है, तो 112 पर कॉल करें। अकेले इंतज़ार मत कीजिए।";

export const DISTRESS_RESPONSE_EN =
  "I am concerned. I am not a doctor. Please call your Guardian or a trusted person nearby now. For chest pain, a fall, breathing trouble, or immediate danger, call 112. Please do not wait alone.";

export function fallbackScamCopy(risk: ScamRisk) {
  if (risk === "HIGH") {
    return {
      explanation_hi:
        "यह संदेश धोखाधड़ी जैसा लगता है। डर या जल्दी दिखाकर पैसे, OTP या कॉल करवाने की कोशिश हो रही है।",
      explanation_en:
        "This strongly resembles a scam. It uses urgency or fear to push you to call, pay, or share a secret.",
      action:
        "जवाब न दें, नंबर पर कॉल न करें, OTP या पैसे न भेजें। अभी अपने Guardian से बात करें।",
    };
  }
  if (risk === "SUSPICIOUS") {
    return {
      explanation_hi:
        "इसमें धोखाधड़ी के कुछ संकेत हैं। इसे सही मानकर कोई कदम न उठाएँ।",
      explanation_en:
        "This contains warning signs. Do not act on it until a trusted person verifies it independently.",
      action:
        "लिंक न खोलें और OTP/पैसे न दें। अपने Guardian या संस्था के आधिकारिक नंबर से जाँच करें।",
    };
  }
  return {
    explanation_hi:
      "यह संदेश अभी साफ़ तौर पर धोखाधड़ी जैसा नहीं दिखता, लेकिन इसे पूरी तरह सुरक्षित नहीं कहा जा सकता।",
    explanation_en:
      "It does not show obvious scam signs, but it cannot be called definitely safe.",
    action:
      "पैसे या OTP कभी न भेजें। कोई कदम लेने से पहले अपने Guardian से पूछें।",
  };
}
