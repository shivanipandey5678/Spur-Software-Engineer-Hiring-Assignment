type FAQEntry = { keywords: string[]; answer: string };

const SUPPORT_LINE = " For direct help, call +91-98765-43210 (Mon–Fri, 10 AM–6 PM IST) or email support@spurstore.com.";
const SIGN_OFF = " Is there anything else I can help you with?";

const FAQ_DATABASE: FAQEntry[] = [
  {
    keywords: ["ship", "shipping", "delivery", "deliver"],
    answer: "We ship within India in 5–7 business days (metro) and 7–10 days elsewhere; internationally in 7–14 business days. You get a tracking link via SMS and email once dispatched. Free shipping on orders above ₹499 in India." + SUPPORT_LINE + SIGN_OFF,
  },
  {
    keywords: ["return", "returns"],
    answer: "We offer a 7-day return window from the date of delivery. Items must be unused and in original packaging with tags. Start a return from your account (Order History) or email support@spurstore.com with your order ID. Refunds are processed within 3–5 business days after we receive the item." + SUPPORT_LINE + SIGN_OFF,
  },
  {
    keywords: ["refund", "refunds", "money back"],
    answer: "Refunds are processed within 3–5 business days after we receive and inspect the return. Amount is credited to the same payment method. For cards it may take 7–10 business days to reflect." + SUPPORT_LINE + SIGN_OFF,
  },
  {
    keywords: ["payment", "pay", "card", "upi"],
    answer: "We accept Credit/Debit cards, UPI, Net Banking, digital wallets, EMI (on select products), and Cash on Delivery for eligible pin codes in India." + SIGN_OFF,
  },
  {
    keywords: ["support hours", "contact", "working hours", "customer care"],
    answer: "Our support is available Monday–Friday, 10:00 AM–6:00 PM IST. Call +91-98765-43210 (toll-free: 1800-419-SPUR) or email support@spurstore.com. We reply to emails within 24 hours. Please reach out during these hours for your queries." + SIGN_OFF,
  },
  {
    keywords: ["about", "company", "who are you", "what is spur", "founder"],
    answer: "Spur (Spur Commerce Pvt Ltd) is an Indian e-commerce company founded in 2019. Founder: Rajesh Mehta (CEO); Co-founder: Priya Sharma (COO). We sell electronics, gadgets, and lifestyle products. HQ: 4th Floor, Tower B, Cyber City, Gurugram, Haryana 122002. I'm Spur's support assistant—trained on our store data. For orders or policies, call +91-98765-43210 (Mon–Fri, 10 AM–6 PM IST) or email support@spurstore.com." + SIGN_OFF,
  },
  {
    keywords: ["address", "office", "location"],
    answer: "Our registered office: 4th Floor, Tower B, Cyber City, Gurugram, Haryana 122002, India. For order or account queries, call +91-98765-43210 (Mon–Fri, 10 AM–6 PM IST) or email support@spurstore.com." + SIGN_OFF,
  },
  {
    keywords: ["phone", "number", "call"],
    answer: "Support phone: +91-98765-43210. Toll-free (India): 1800-419-SPUR. Available Mon–Fri, 10 AM–6 PM IST. Please call within these hours for your queries." + SIGN_OFF,
  },
  {
    keywords: ["email", "mail"],
    answer: "Support email: support@spurstore.com. We respond within 24 hours. For urgent issues you can also call +91-98765-43210 (Mon–Fri, 10 AM–6 PM IST)." + SIGN_OFF,
  },
];

export function quickFAQMatch(message: string): string | null {
  const lower = message.toLowerCase();
  if (message.length > 120) return null;

  for (const faq of FAQ_DATABASE) {
    const hasMatch = faq.keywords.some(k => lower.includes(k));
    if (hasMatch && (lower.includes("?") || lower.split(" ").length < 12)) return faq.answer;
  }
  return null;
}
