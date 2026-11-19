/**
 * Contextual Retention Message Drafter
 * Generates personalized, high-converting renewal messages in English, Hinglish, and Hindi
 * with the right offer aligned to the member's churn risk tier.
 */

import { RiskAction } from "./risk-score";

export type MessageLanguage = "en" | "hinglish" | "hi";

export interface MessageContext {
  memberName: string;
  phone: string;
  gymName: string;
  planName: string;
  expiryDateStr: string;
  daysUntilExpiry: number;
  renewalPrice: number;
  upiPaymentLink?: string;
  recommendedAction: RiskAction;
  preferredLanguage?: MessageLanguage;
}

export interface DraftedMessage {
  language: MessageLanguage;
  subject: string;
  body: string;
  whatsappUrl: string;
  offerType: "STANDARD_RENEWAL" | "EARLY_BIRD_BONUS" | "PAUSE_PROTECTION" | "SPECIAL_COMEBACK_DISCOUNT";
}

/**
 * Normalizes Indian phone number to international 12-digit format without + or spaces for WhatsApp URL
 * e.g. "9876543210" -> "919876543210", "+91 98765 43210" -> "919876543210"
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, "");
  // Strip leading 0 if 11 digits
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return `91${digits}`;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  return digits;
}

export function draftRenewalMessage(ctx: MessageContext): DraftedMessage {
  const lang = ctx.preferredLanguage || "hinglish";
  const formattedPhone = normalizePhoneForWhatsApp(ctx.phone);
  const paymentLink = ctx.upiPaymentLink || "https://repsync.fit/pay";

  let body = "";
  let subject = "";
  let offerType: DraftedMessage["offerType"] = "STANDARD_RENEWAL";

  if (ctx.recommendedAction === "CALL_DIRECTLY") {
    // Member has severely lapsed
    offerType = "SPECIAL_COMEBACK_DISCOUNT";
    if (lang === "hinglish") {
      subject = "We miss seeing you at the gym!";
      body = `Hi ${ctx.memberName}! 👋 Humne notice kiya aap kaafi din se ${ctx.gymName} nahi aa rahe hain. Sab theek hai na? Aapka ${ctx.planName} plan ${ctx.daysUntilExpiry <= 0 ? "expire ho chuka hai" : `${ctx.daysUntilExpiry} din me expire ho raha hai`}. 

Hum chahte hain aap apni fitness journey continue karein! Isliye hum aapko renew karne par special comeback discount + 1 personal training session free offer kar rahe hain. 

Aap kab aana chahenge? Reply karein ya directly renew karein: ${paymentLink}`;
    } else if (lang === "hi") {
      subject = "हम आपको जिम में मिस कर रहे हैं!";
      body = `नमस्ते ${ctx.memberName}! 👋 हमने देखा कि आप काफी दिनों से ${ctx.gymName} नहीं आ पा रहे हैं। सब ठीक है? आपकी ${ctx.planName} सदस्यता ${ctx.daysUntilExpiry <= 0 ? "समाप्त हो चुकी है" : `${ctx.daysUntilExpiry} दिनों में समाप्त हो रही है`}।

हम आपके फिटनेस लक्ष्य को पूरा करने में मदद करना चाहते हैं। आज रिन्यू करने पर विशेष छूट प्राप्त करें: ${paymentLink}`;
    } else {
      subject = `We miss you at ${ctx.gymName}!`;
      body = `Hi ${ctx.memberName}, we've missed seeing you on the gym floor at ${ctx.gymName}! Hope all is well. Your ${ctx.planName} membership is ${ctx.daysUntilExpiry <= 0 ? "due for renewal" : `expiring in ${ctx.daysUntilExpiry} days`}.

To help you get right back on track, we've unlocked a special comeback offer + a complimentary 1-on-1 personal training session.

Renew online here: ${paymentLink} or let us know if you have any questions!`;
    }
  } else if (ctx.recommendedAction === "OFFER_PAUSE_BENEFIT") {
    // Traveling or busy member
    offerType = "PAUSE_PROTECTION";
    if (lang === "hinglish") {
      subject = "Traveling or busy? Pause anytime!";
      body = `Hi ${ctx.memberName}! 👋 Aapka ${ctx.planName} plan ${ctx.expiryDateStr} ko expire ho raha hai. Agar aap travel kar rahe hain ya busy schedule hai, toh fikar mat kijiye — renew karne par aapko FREE 15-day pause benefit milega jise aap kabhi bhi use kar sakte hain!

Renew in 10 seconds via UPI: ${paymentLink}`;
    } else if (lang === "hi") {
      subject = "व्यस्त हैं या यात्रा पर? सदस्यता पॉज़ करें!";
      body = `नमस्ते ${ctx.memberName}! आपकी ${ctx.planName} सदस्यता ${ctx.expiryDateStr} को समाप्त हो रही है। यदि आप व्यस्त हैं, तो रिन्यू करने पर आपको निःशुल्क 15 दिन की पॉज़ सुविधा मिलेगी।

UPI से रिन्यू करें: ${paymentLink}`;
    } else {
      subject = `Traveling or busy? Renew with free pause protection`;
      body = `Hi ${ctx.memberName}, your ${ctx.planName} membership at ${ctx.gymName} is expiring on ${ctx.expiryDateStr}. If you're traveling or tied up with work, don't worry — renew this week and receive a complimentary 15-day membership freeze to use whenever you need!

Renew here: ${paymentLink}`;
    }
  } else if (ctx.recommendedAction === "OFFER_RENEWAL_DISCOUNT") {
    offerType = "EARLY_BIRD_BONUS";
    if (lang === "hinglish") {
      subject = "Early bird renewal bonus inside!";
      body = `Hi ${ctx.memberName}! 💪 Aapki consistency kamaal ki rahi hai ${ctx.gymName} me! Aapka plan ${ctx.daysUntilExpiry} din me expire ho raha hai. Agle 48 ghante me renew karne par enjoy flat ₹${Math.round(ctx.renewalPrice * 0.1)} OFF (Instant UPI offer).

Link: ${paymentLink}`;
    } else if (lang === "hi") {
      subject = "विशेष रिन्यूअल ऑफर!";
      body = `नमस्ते ${ctx.memberName}! ${ctx.gymName} में आपका फिटनेस सफर शानदार रहा है। आपका प्लान ${ctx.daysUntilExpiry} दिनों में समाप्त हो रहा है। आज रिन्यू करें और विशेष छूट प्राप्त करें: ${paymentLink}`;
    } else {
      subject = `Early bird renewal perk for ${ctx.memberName}`;
      body = `Hi ${ctx.memberName}! Great progress on your fitness goals at ${ctx.gymName}. Your ${ctx.planName} expires in ${ctx.daysUntilExpiry} days. Renew in the next 48 hours to lock in our early-bird renewal rate (₹${ctx.renewalPrice}).

One-click UPI renewal: ${paymentLink}`;
    }
  } else {
    // Regular gentle reminder
    offerType = "STANDARD_RENEWAL";
    if (lang === "hinglish") {
      subject = "Your gym renewal reminder";
      body = `Hi ${ctx.memberName}! 🏋️‍♂️ Just a quick reminder that your ${ctx.planName} at ${ctx.gymName} expires on ${ctx.expiryDateStr} (${ctx.daysUntilExpiry} days left). Continue your streak without interruption!

Quick UPI renewal: ${paymentLink}`;
    } else if (lang === "hi") {
      subject = "जिम सदस्यता रिन्यूअल सूचना";
      body = `नमस्ते ${ctx.memberName}! सूचित किया जाता है कि ${ctx.gymName} में आपकी सदस्यता ${ctx.expiryDateStr} को समाप्त हो रही है। निर्बाध वर्कआउट के लिए कृपया समय पर रिन्यू करें: ${paymentLink}`;
    } else {
      subject = `Upcoming renewal at ${ctx.gymName}`;
      body = `Hi ${ctx.memberName}! Just a friendly heads-up that your ${ctx.planName} membership at ${ctx.gymName} will expire on ${ctx.expiryDateStr} (${ctx.daysUntilExpiry} days left). Keep up the fantastic momentum!

Renew online: ${paymentLink}`;
    }
  }

  const encodedBody = encodeURIComponent(body);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedBody}`;

  return {
    language: lang,
    subject,
    body,
    whatsappUrl,
    offerType,
  };
}
