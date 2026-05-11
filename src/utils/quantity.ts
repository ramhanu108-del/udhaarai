import { InventoryUnit } from '../types';

const COUNT_BASED_UNITS = ['pcs', 'piece', 'packet', 'box', 'bottle', 'unit', 'other'];

export function isDecimalAllowedForUnit(unit: string | InventoryUnit): boolean {
  if (!unit) return false;
  return !COUNT_BASED_UNITS.includes(unit.toLowerCase());
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
