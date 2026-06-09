export interface ProfitInput {
  costPrice: number;
  sellPrice: number;
}

export interface ProfitBreakdown {
  costAfterVAT: number;
  sellAfterVAT: number;
  madaNet: number;
  madaProfit: number;
  visaNet: number;
  visaProfit: number;
  tamaraNet: number;
  tamaraProfit: number;
}

const VAT_RATE = 0.15;
const MADA_PCT = 0.01;
const MADA_FLAT = 1;
const VISA_PCT = 0.022;
const VISA_FLAT = 1;
const TAMARA_PCT = 0.0699;
const TAMARA_FLAT = 1.5;

export function calcCostAfterVAT(costPrice: number): number {
  return costPrice * (1 + VAT_RATE);
}

export function calcSellAfterVAT(sellPrice: number): number {
  return sellPrice * (1 + VAT_RATE);
}

function calcCommission(
  sellAfterVAT: number,
  pct: number,
  flat: number
): number {
  return ((sellAfterVAT * pct) + flat) * (1 + VAT_RATE);
}

export function calcMada(sellAfterVAT: number): { net: number; commission: number } {
  const commission = calcCommission(sellAfterVAT, MADA_PCT, MADA_FLAT);
  return { commission, net: sellAfterVAT - commission };
}

export function calcVisa(sellAfterVAT: number): { net: number; commission: number } {
  const commission = calcCommission(sellAfterVAT, VISA_PCT, VISA_FLAT);
  return { commission, net: sellAfterVAT - commission };
}

export function calcTamara(sellAfterVAT: number): { net: number; commission: number } {
  const commission = calcCommission(sellAfterVAT, TAMARA_PCT, TAMARA_FLAT);
  return { commission, net: sellAfterVAT - commission };
}

export function calculateProfit(input: ProfitInput): ProfitBreakdown {
  const costAfterVAT = calcCostAfterVAT(input.costPrice);
  const sellAfterVAT = calcSellAfterVAT(input.sellPrice);
  const mada = calcMada(sellAfterVAT);
  const visa = calcVisa(sellAfterVAT);
  const tamara = calcTamara(sellAfterVAT);

  return {
    costAfterVAT: Math.round(costAfterVAT * 100) / 100,
    sellAfterVAT: Math.round(sellAfterVAT * 100) / 100,
    madaNet: Math.round(mada.net * 100) / 100,
    madaProfit: Math.round((mada.net - costAfterVAT) * 100) / 100,
    visaNet: Math.round(visa.net * 100) / 100,
    visaProfit: Math.round((visa.net - costAfterVAT) * 100) / 100,
    tamaraNet: Math.round(tamara.net * 100) / 100,
    tamaraProfit: Math.round((tamara.net - costAfterVAT) * 100) / 100,
  };
}
