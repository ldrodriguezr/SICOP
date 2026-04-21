import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import https from 'https';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Updates a batch of procedures to 'adjudicado' state.
 */
async function updateBatchToAdjudicado(procedures: string[]): Promise<number> {
  if (procedures.length === 0) return 0;
  
  // We use the IN operator to update multiple records at once
  const { error } = await supabase
    .from('licitaciones')
    .update({ estado: 'adjudicado' })
    .in('numero_procedimiento', procedures);

  if (error) {
    console.error(`  [ERROR] updating licitaciones status: ${error.message}`);
    return 0;
  }
  return procedures.length;
}

/**
 * Reads AdjudicacionesFirme.csv and processes it in batches.
 */
async function processCsv(
  filePath: string,
): Promise<number> {
  let totalUpdated = 0;
  let batch: string[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', async (row) => {
        // NRO_SICOP is the numero_procedimiento
        const nroSicop = row.NRO_SICOP ? row.NRO_SICOP.replace(/^"|"$/g, '') : null;
        if (nroSicop && !batch.includes(nroSicop)) {
            batch.push(nroSicop);
        }

        if (batch.length >= 100) {
          const current = [...batch];
          batch = [];
          totalUpdated += await updateBatchToAdjudicado(current);
        }
      })
      .on('end', async () => {
        if (batch.length > 0) {
          totalUpdated += await updateBatchToAdjudicado(batch);
        }
        resolve(totalUpdated);
      })
      .on('error', reject);
  });
}

const processMonthForStatus = async (year: number, month: number) => {
  const yyyymm = `${year}${month.toString().padStart(2, '0')}`;
  const zipPath = path.resolve(__dirname, `../temp_${yyyymm}.zip`);
  const extractPath = path.resolve(__dirname, `../temp_extract_adj_${yyyymm}`);

  if (!fs.existsSync(zipPath)) {
      // Skip if we don't have the zip downloaded
      return;
  }

  console.log(`\n=========================================`);
  console.log(`UPDATING STATUS: ${yyyymm}`);
  console.log(`=========================================`);

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const entries = fs.readdirSync(extractPath, { withFileTypes: true });
    const dirEntry = entries.find(e => e.isDirectory());
    const baseDir = dirEntry ? path.join(extractPath, dirEntry.name) : extractPath;

    // Process AdjudicacionesFirme.csv for statuses
    const adjFile = path.join(baseDir, 'AdjudicacionesFirme.csv');
    if (fs.existsSync(adjFile)) {
      console.log(`=> Processing AdjudicacionesFirme.csv -> UPDATE estado = 'adjudicado'...`);
      const updatedCount = await processCsv(adjFile);
      console.log(`   => licitaciones marked as adjudicado: ${updatedCount}`);
    } else {
        console.log(`=> No AdjudicacionesFirme.csv found for ${yyyymm}`);
    }
  } catch (error: any) {
    console.error(`FAILED ${yyyymm}: ${error.message}`);
  } finally {
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
  }
};

async function main() {
  const args = process.argv.slice(2);
  const startYear = parseInt(args[0]) || 2024;
  const startMonth = parseInt(args[1]) || 1;
  const endYear = parseInt(args[2]) || 2026;
  const endMonth = parseInt(args[3]) || 4;

  console.log(`\nSTARTING STATUS UPDATE LOAD: ${startYear}-${String(startMonth).padStart(2,'0')} → ${endYear}-${String(endMonth).padStart(2,'0')}`);

  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 1;
    const mEnd = y === endYear ? endMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      await processMonthForStatus(y, m);
    }
  }

  console.log('\n--- STATUS UPDATES COMPLETED ---');
}

main().catch(console.error);
