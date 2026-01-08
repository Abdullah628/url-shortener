import { Pool } from 'pg';
import crypto from 'crypto';

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 7;
const BATCH_SIZE = 10000; // Insert in batches for performance

function generateRandomCode(): string {
  let code = '';
  const randomBytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    const byte = randomBytes[i];
    if (byte !== undefined) {
      code += CHARACTERS[byte % CHARACTERS.length];
    }
  }
  return code;
}

function generateUniqueCodes(count: number): Set<string> {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateRandomCode());
  }
  return codes;
}

async function seedShortCodePool(pool: Pool, totalCodes: number): Promise<void> {
  console.log(`🔑 Generating ${totalCodes} unique short codes...`);
  
  const codes = generateUniqueCodes(totalCodes);
  const codesArray = Array. from(codes);
  
  console.log(`📦 Inserting codes in batches of ${BATCH_SIZE}...`);
  
  for (let i = 0; i < codesArray.length; i += BATCH_SIZE) {
    const batch = codesArray.slice(i, i + BATCH_SIZE);
    const values = batch.map((_code, idx) => `($${idx + 1})`).join(',');
    const query = `
      INSERT INTO short_code_pool (short_code) 
      VALUES ${values}
      ON CONFLICT (short_code) DO NOTHING
    `;
    
    await pool.query(query, batch);
    console.log(`  ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(codesArray. length / BATCH_SIZE)}`);
  }
  
  console.log('🎉 Short code pool seeded successfully!');
}

async function checkAndReplenishPool(pool: Pool, threshold: number, replenishCount: number): Promise<void> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM short_code_pool WHERE is_used = FALSE'
  );
  
  const availableCount = parseInt(result.rows[0].count);
  console.log(`📊 Available short codes: ${availableCount}`);
  
  if (availableCount < threshold) {
    console.log(`⚠️ Below threshold (${threshold}), replenishing with ${replenishCount} new codes...`);
    await seedShortCodePool(pool, replenishCount);
  } else {
    console.log('✅ Pool has sufficient codes');
  }
}

// Usage: 
// Initial seeding:  seedShortCodePool(pool, 1_000_000)
// Cron job: checkAndReplenishPool(pool, 100_000, 500_000)

export { seedShortCodePool, checkAndReplenishPool, generateRandomCode };