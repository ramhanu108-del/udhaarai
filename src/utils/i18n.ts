export type Locale = 'en' | 'hi' | 'hinglish';

const translations = {
  en: {
    welcome_back: 'Welcome back,',
    total_pending: 'Total Pending Udhaar',
    todays_sales: "Today's Sales",
    collection: 'Collection',
    quick_actions: 'Quick Actions',
    udhaar: 'Give Udhaar',
    payment: 'Receive Payment',
    add_sale: 'Add Sale',
    customer: 'Customer',
    ai_tip_title: 'AI Business Tip',
  },
  hinglish: {
    welcome_back: 'Namaste,',
    total_pending: 'Kul Baki Udhaar',
    todays_sales: 'Aaj ki Sales',
    collection: 'Aaj ka Collection',
    quick_actions: 'Quick Actions',
    udhaar: 'Udhaar Dein',
    payment: 'Payment Lein',
    add_sale: 'Sale Likhein',
    customer: 'Naya Grahak',
    ai_tip_title: 'Smart AI Tip',
  },
  hi: {
    welcome_back: 'नमस्ते,',
    total_pending: 'कुल बकाया उधार',
    todays_sales: 'आज की बिक्री',
    collection: 'आज की वसूली',
    quick_actions: 'क्विक एक्शन',
    udhaar: 'उधार दें',
    payment: 'पेमेंट लें',
    add_sale: 'बिक्री जोड़ें',
    customer: 'ग्राहक जोड़ें',
    ai_tip_title: 'AI बिज़नेस टिप',
  }
};

export function t(key: keyof typeof translations.en, locale: Locale = 'hinglish'): string {
  return translations[locale][key] || translations.en[key];
}
