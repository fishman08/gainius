export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalInches = cm / CM_PER_INCH;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches - ft * 12) * 10) / 10;
  return { ft, inches };
}

export function feetInchesToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * CM_PER_INCH * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round((kg / KG_PER_LB) * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * KG_PER_LB * 10) / 10;
}
