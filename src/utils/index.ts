import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format amount from paise to rupees
export function formatCurrency(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
}

export type ReminderTone = 'polite' | 'friendly' | 'strict' | 'short';

export function generateReminderMessage(
  customerName: string, 
  amountInPaise: number, 
  shopName: string, 
  language: 'en' | 'hi' | 'hinglish' = 'hinglish',
  tone: ReminderTone = 'polite',
  dueDateStr?: string
): string {
  const amount = formatCurrency(amountInPaise);
  const dueInfo = dueDateStr ? ` by ${dueDateStr}` : '';
  const dueInfoHi = dueDateStr ? ` ${dueDateStr} tak` : '';
  
  const shortName = customerName.split(' ')[0];

  if (language === 'hi') {
    if (tone === 'strict') return `ज़रूरी सूचना ${shortName}: आपका ${amount} का बैलेंस बकाया है। कृपया इसे${dueInfoHi} तुरंत जमा करें। - ${shopName}`;
    if (tone === 'friendly') return `नमस्ते ${shortName} भाई, आपका ${amount} का पेमेंट पेंडिंग है। समय निकालकर${dueInfoHi} भिजवा दें। - ${shopName}`;
    if (tone === 'short') return `${shortName} जी, ₹${amountInPaise/100} बकाया हैं। कृपया पे करें। - ${shopName}`;
    // polite
    return `नमस्ते ${customerName} जी, आपका ${amount} का पेमेंट पेंडिंग है। कृपया समय पर भुगतान करें। धन्यवाद। - ${shopName}`;
  }
  
  if (language === 'en') {
    if (tone === 'strict') return `URGENT ${shortName}: Your due amount is ${amount}. Please pay${dueInfo} immediately to avoid account suspension. - ${shopName}`;
    if (tone === 'friendly') return `Hi ${shortName}! Just a quick reminder about your pending balance of ${amount}. Please pay${dueInfo} when you can. Thanks! - ${shopName}`;
    if (tone === 'short') return `Hi ${shortName}, ${amount} is due${dueInfo}. Pls pay. - ${shopName}`;
    // polite
    return `Dear ${customerName}, this is a gentle reminder that your payment of ${amount} is pending. Please complete the payment at your earliest convenience. Thank you. - ${shopName}`;
  }
  
  // hinglish
  if (tone === 'strict') return `Urgent ${shortName}: Aapka ${amount} ka udhaar pending hai. Kripya isko${dueInfoHi} jaldi clear karein warna aage udhaar nahi mil payega. - ${shopName}`;
  if (tone === 'friendly') return `Hello ${shortName} bhai! Ek chota sa reminder tha ki aapka ${amount} baaki hai. Fursat milte hi${dueInfoHi} pay kar dena. Thanks! - ${shopName}`;
  if (tone === 'short') return `${shortName} ji, ${amount} ka payment pending hai. Kripya bhej dein. - ${shopName}`;
  
  // polite
  return `Namaste ${customerName} ji, aapka ${amount} ka udhaar baki hai. Kripya samay nikaal kar${dueInfoHi} payment kar dein. Dhanyavaad. - ${shopName}`;
}

export function generateInvoiceWhatsAppMessage(invoiceNumber: string, status: string, amountInPaise: number, shopName: string, customerName?: string): string {
  const amount = formatCurrency(amountInPaise);
  let msg = `Namaste${customerName ? ` ${customerName} ji` : ''},\n`;
  msg += `Aapka bill ${shopName} se:\n\n`;
  msg += `Invoice: ${invoiceNumber}\n`;
  msg += `Total: ${amount}\n`;
  msg += `Status: ${status}\n\n`;
  msg += `Dhanyavaad.`;
  return msg;
}

export const SHOW_PREMIUM_FEATURES = false;


