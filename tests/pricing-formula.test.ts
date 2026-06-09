import { calculateSellPrice } from '../src/constants/pricing-formula';

const EPSILON = 1e-9;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

function assertClose(actual: number, expected: number, message: string): void {
  const pass = Math.abs(actual - expected) < EPSILON;
  if (!pass) {
    console.error(`✗ FAIL: ${message} — expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ PASS: ${message} (${actual})`);
  }
}

// ========== Test 1: Exact example from spec ==========
{
  const r = calculateSellPrice(100, 20);
  assertClose(r.base, 120, 'Base = 120');
  assertClose(r.fees, 9.888, 'Fees = 9.888');
  assertClose(r.vat, 1.4832, 'FeesVAT = 1.4832');
  assertClose(r.total, 131.3712, 'Total = 131.3712');
  assert(r.finalPrice === 152, 'FinalPrice = 152 (integer, no decimals)');
  assert(!Number.isInteger(r.priceBeforeVAT), 'PriceBeforeVAT must NOT be rounded');
  assertClose(r.priceBeforeVAT, 152 / 1.15, 'PriceBeforeVAT = 152 / 1.15 (raw, unrounded)');
  assert(Number.isInteger(r.finalPrice), 'FinalPrice must be an integer');
  // Verify: priceBeforeVAT is what gets written to store file
  assertClose(r.priceBeforeVAT, 132.17391304347828, 'priceBeforeVAT = 132.173913... = written to store');
}

// ========== Test 2: Zero profit ==========
{
  const r = calculateSellPrice(50, 0);
  assertClose(r.base, 50, 'Base = 50');
  assertClose(r.fees, 50 * 0.0699 + 1.5, 'Fees correctly calculated');
  const expectedTotal = 50 + (50 * 0.0699 + 1.5) + (50 * 0.0699 + 1.5) * 0.15;
  assertClose(r.total, expectedTotal, 'Total correctly calculated');
  assert(Number.isInteger(r.finalPrice), 'FinalPrice must be an integer');
  assert(!Number.isInteger(r.priceBeforeVAT), 'PriceBeforeVAT must NOT be rounded');
}

// ========== Test 3: CostPrice = 0 ==========
{
  const r = calculateSellPrice(0, 10);
  assertClose(r.base, 10, 'Base = 10');
  assertClose(r.fees, 10 * 0.0699 + 1.5, 'Fees correctly calculated');
  assert(Number.isInteger(r.finalPrice), 'FinalPrice must be an integer');
  assert(!Number.isInteger(r.priceBeforeVAT), 'PriceBeforeVAT must NOT be rounded');
}

// ========== Test 4: Large numbers ==========
{
  const r = calculateSellPrice(1000, 200);
  assertClose(r.base, 1200, 'Base = 1200');
  assert(Number.isInteger(r.finalPrice), 'FinalPrice must be an integer');
  assert(!Number.isInteger(r.priceBeforeVAT), 'PriceBeforeVAT must NOT be rounded');
}

// ========== Test 5: Verify Math.ceil only (no floor/round for final) ==========
{
  const r = calculateSellPrice(1, 1);
  const manualBase = 2;
  const manualFees = 2 * 0.0699 + 1.5;
  const manualVat = manualFees * 0.15;
  const manualTotal = manualBase + manualFees + manualVat;
  const manualFinal = Math.ceil(manualTotal * 1.15);
  assert(r.finalPrice === manualFinal, `FinalPrice ${r.finalPrice} must equal Math.ceil result ${manualFinal}`);
}

// ========== Test 6: Verify floating point stability ==========
{
  for (let i = 0; i < 100; i++) {
    const r = calculateSellPrice(i + 1, i);
    const reCalc = calculateSellPrice(i + 1, i);
    assert(r.finalPrice === reCalc.finalPrice, `Deterministic: iteration ${i}`);
    assert(Number.isInteger(r.finalPrice), `Integer finalPrice at iteration ${i}`);
  }
}

// ========== Test 7: FinalPrice is always integer; priceBeforeVAT is never integer ==========
{
  const r = calculateSellPrice(7.5, 3.25);
  assert(Number.isInteger(r.finalPrice), `FinalPrice must be integer, got ${r.finalPrice}`);
  assert(!Number.isInteger(r.priceBeforeVAT), 'priceBeforeVAT must NOT be integer');
}

// ========== Test 8: priceBeforeVAT = finalPrice / 1.15 (exact, no rounding) ==========
{
  const r = calculateSellPrice(100, 20);
  const rawPriceBeforeVAT = r.finalPrice / 1.15;
  assert(r.priceBeforeVAT === rawPriceBeforeVAT, 'priceBeforeVAT = finalPrice / 1.15');
}

// ========== Test 9: priceBeforeVAT is what gets written to store ==========
{
  // Simulate export: sellPrice in column H = calc.priceBeforeVAT
  const r = calculateSellPrice(100, 20);
  const writtenToColumnH = r.priceBeforeVAT;
  assertClose(writtenToColumnH, 132.17391304347828, 'Column H gets priceBeforeVAT (132.17...)');
  assert(writtenToColumnH !== r.finalPrice, 'Column H value differs from finalPrice');
}

console.log('\nAll tests completed.');
if (process.exitCode) {
  console.error('Some tests FAILED.');
} else {
  console.log('All tests PASSED.');
}
