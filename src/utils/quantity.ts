import { InventoryUnit } from '../types';

const WHOLE_NUMBER_UNITS = [
  'pcs', 'piece', 'pieces', 
  'packet', 'packets', 
  'box', 'boxes', 
  'g', 'gram', 'grams', 
  'ml', 'bottle', 'unit', 'other'
];

const DECIMAL_UNITS = [
  'kg', 'kilogram', 'kilograms', 
  'l', 'liter', 'litre', 'liters', 'litres'
];

export function isDecimalAllowedForUnit(unit: string | InventoryUnit): boolean {
  if (!unit) return false;
  const normalized = unit.toLowerCase();
  
  if (DECIMAL_UNITS.includes(normalized)) {
    return true;
  }
  
  return !WHOLE_NUMBER_UNITS.includes(normalized);
}

export function validateQuantityByUnit(value: number, unit: string | InventoryUnit, options?: { allowZero?: boolean }): { valid: boolean; error?: string } {
  if (isNaN(value) || !isFinite(value) || value < 0) {
    return { valid: false, error: 'Quantity positive honi chahiye.' };
  }
  
  if (value === 0 && !options?.allowZero) {
    return { valid: false, error: 'Quantity > 0 honi chahiye.' };
  }

  const isDecimalAllowed = isDecimalAllowedForUnit(unit);

  if (!isDecimalAllowed && !Number.isInteger(value)) {
    return { valid: false, error: `${unit} mein decimal quantity allowed nahi hai.` };
  }

  if (isDecimalAllowed) {
    // Check if it has more than 3 decimal places
    const strValue = value.toString();
    if (strValue.includes('.')) {
      const decimals = strValue.split('.')[1];
      if (decimals && decimals.length > 3) {
        return { valid: false, error: `Maximum 3 decimal places allowed for ${unit}.` };
      }
    }
  }

  return { valid: true };
}

export function sanitizeQuantityByUnit(value: number, unit: string | InventoryUnit): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  
  if (!isDecimalAllowedForUnit(unit)) {
    return Math.trunc(value); // Ignore decimals
  }
  
  return Number(value.toFixed(3));
}
