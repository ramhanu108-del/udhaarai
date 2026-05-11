export interface MoneyValidationOptions {
  required?: boolean;
  allowZero?: boolean;
}

export function validateMoneyAmount(value: number | string, options?: MoneyValidationOptions): { valid: boolean; error?: string } {
  let parsedValue = typeof value === 'string' ? parseFloat(value) : value;

  if (options?.required && (value === '' || value === null || value === undefined || isNaN(parsedValue))) {
    return { valid: false, error: 'Amount is required.' };
  }

  if (isNaN(parsedValue) || !isFinite(parsedValue)) {
    if (value === '' && !options?.required) {
      return { valid: true };
    }
    return { valid: false, error: 'Amount must be a valid number.' };
  }

  if (parsedValue < 0) {
    return { valid: false, error: 'Amount positive hona chahiye.' };
  }

  if (parsedValue === 0 && !options?.allowZero) {
    return { valid: false, error: 'Amount 0 se zyada hona chahiye.' };
  }

  const parts = parsedValue.toString().split('.');
  if (parts.length > 1 && parts[1].length > 2) {
    return { valid: false, error: 'Amount mein max 2 decimals allowed hain.' };
  }

  return { valid: true };
}

export const handleMoneyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
  }
};

export const sanitizeMoneyInput = (value: string): string => {
  if (value.includes('-') || value.includes('+') || value.toLowerCase().includes('e')) {
    return value.replace(/[-+eE]/g, '');
  }
  return value;
};
