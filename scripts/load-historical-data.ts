// @ts-nocheck — script de carga de datos, no forma parte del build de Next.js
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import https from 'https';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// === GLOBAL REPORT COUNTERS ===
const report = {
  months_ok: [] as string[],
  months_failed: [] as string[],
  total_licitaciones: 0,
  total_historial: 0,
};

/**
 * Downloads a file from a URL to a local destination
 */
const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        return reject(new Error(`Data not found for ${url} (404)`));
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

/**
 * Upserts a batch of records into a Supabase table. Returns count inserted.
 */
async function upsertBatch(table: string, records: any[]): Promise<number> {
  if (records.length === 0) return 0;
  const { error } = await supabase
    .from(table)
    .upsert(records, {
      onConflict: table === 'licitaciones' ? 'numero_procedimiento' : undefined,
    });
  if (error) {
    console.error(`  [ERROR] upserting to ${table}: ${error.message}`);
    return 0;
  }
  return records.length;
}

/**
 * Reads a CSV file and processes it in batches using a row transformer function.
 */
async function processCsv(
  filePath: string,
  table: string,
  transformer: (row: any) => any
): Promise<number> {
  let totalInserted = 0;
  let batch: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
        .on('data', async (row) => {
          const record = transformer(row);
          if (record) {
            for (let key in record) {
              if (typeof record[key] === 'string') record[key] = record[key].replace(/^"|"$/g, '');
            }
            batch.push(record);
          }
          if (batch.length >= 500) {
            const current = [...batch];
            batch = [];
            totalInserted += await upsertBatch(table, current);
          }
        })
        .on('end', async () => {
        if (batch.length > 0) {
          totalInserted += await upsertBatch(table, batch);
        }
        resolve(totalInserted);
      })
      .on('error', reject);
  });
}

/**
 * Processes a specific month's data from SICOP/Observatorio
 */
const processMonth = async (year: number, month: number) => {
  const yyyymm = `${year}${month.toString().padStart(2, '0')}`;
  const url = `https://dlsaobservatorioprod.blob.core.windows.net/fs-synapse-observatorio-produccion/Zip/${yyyymm}.zip`;
  const zipPath = path.resolve(__dirname, `../temp_${yyyymm}.zip`);
  const extractPath = path.resolve(__dirname, `../temp_extract_${yyyymm}`);

  console.log(`\n=========================================`);
  console.log(`PROCESSING: ${yyyymm}`);
  console.log(`=========================================`);

  let licitacionesCount = 0;
  let historialCount = 0;

  try {
    // Download if not cached
    if (!fs.existsSync(zipPath)) {
      console.log(`=> Downloading...`);
      await downloadFile(url, zipPath);
    } else {
      console.log(`=> Using cached ZIP.`);
    }

    console.log(`=> Extracting...`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Dynamic folder detection (SICOP sometimes uses yyyymm, sometimes something else)
    const entries = fs.readdirSync(extractPath, { withFileTypes: true });
    const dirEntry = entries.find(e => e.isDirectory());
    
    // If a directory is found, use it. Otherwise, use the extract path itself (root)
    const baseDir = dirEntry ? path.join(extractPath, dirEntry.name) : extractPath;
    console.log(`=> Using base directory: ${baseDir}`);

    // 1. DetalleCarteles.csv -> licitaciones
    const cartelesFile = path.join(baseDir, 'DetalleCarteles.csv');
    if (fs.existsSync(cartelesFile)) {
      console.log(`=> Processing DetalleCarteles.csv -> licitaciones...`);
      licitacionesCount = await processCsv(cartelesFile, 'licitaciones', (row) => ({
        numero_procedimiento: row.NRO_SICOP,
        tipo: row.TIPO_PROCEDIMIENTO,
        titulo: row.CARTEL_NM || 'Sin título',
        institucion: row.CEDULA_INSTITUCION || 'Desconocida',
        fecha_publicacion: row.FECHA_PUBLICACION ? new Date(row.FECHA_PUBLICACION).toISOString() : null,
        fecha_limite_oferta: row.FECHAH_APERTURA ? new Date(row.FECHAH_APERTURA).toISOString() : null,
        monto_estimado: parseFloat(row.MONTO_EST) || 0,
        moneda: 'CRC',
        estado: 'activo',
        raw_data: row,
      }));
      console.log(`   => licitaciones: ${licitacionesCount} rows upserted`);
    }

    // 2. OrdenPedido.csv -> historial_precios
    const ordersFile = path.join(baseDir, 'OrdenPedido.csv');
    if (fs.existsSync(ordersFile)) {
      console.log(`=> Processing OrdenPedido.csv -> historial_precios...`);
      historialCount = await processCsv(ordersFile, 'historial_precios', (row) => ({
        codigo_cabie: row.NUMERO_PROCEDIMIENTO || null,
        descripcion_bien: row.DESC_PROCEDIMIENTO || null,
        institucion: row.NRO_SICOP || null,
        monto_adjudicado: parseFloat(row.TOTAL_ORDEN) || 0,
        fecha_adjudicacion: row.FECHA_PROVEEDOR_RECIBE_ORDEN
          ? new Date(row.FECHA_PROVEEDOR_RECIBE_ORDEN).toISOString()
          : null,
        proveedor_nombre: row.NOMBRE_PROVEEDOR || null,
        precio_unitario: parseFloat(row.USD_MONT) || null,
        año: year,
      }));
      console.log(`   => historial_precios: ${historialCount} rows upserted`);
    }

    // Update global counters
    report.total_licitaciones += licitacionesCount;
    report.total_historial += historialCount;
    report.months_ok.push(yyyymm);
    console.log(`=> DONE ${yyyymm} ✓`);
  } catch (error: any) {
    console.error(`FAILED ${yyyymm}: ${error.message}`);
    report.months_failed.push(`${yyyymm} (${error.message})`);
  } finally {
    // Clean extracted folder, keep zip cache for potential re-runs
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
  }
};

async function printDbTotals() {
  const { count: lic } = await supabase.from('licitaciones').select('*', { count: 'exact', head: true });
  const { count: hist } = await supabase.from('historial_precios').select('*', { count: 'exact', head: true });
  console.log(`\n  DB Total licitaciones:    ${lic?.toLocaleString()} rows`);
  console.log(`  DB Total historial_precios: ${hist?.toLocaleString()} rows`);
}

async function main() {
  const args = process.argv.slice(2);
  const startYear = parseInt(args[0]) || 2024;
  const startMonth = parseInt(args[1]) || 1;
  const endYear = parseInt(args[2]) || 2024;
  const endMonth = parseInt(args[3]) || 12;

  console.log(`\nSTARTING SICOP DATA LOAD: ${startYear}-${String(startMonth).padStart(2,'0')} → ${endYear}-${String(endMonth).padStart(2,'0')}`);

  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 1;
    const mEnd = y === endYear ? endMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      await processMonth(y, m);
    }
  }

  // === FINAL REPORT ===
  console.log(`\n${'='.repeat(50)}`);
  console.log(`FINAL REPORT`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Months OK    : [${report.months_ok.join(', ')}]`);
  console.log(`Months FAILED: ${report.months_failed.length > 0 ? report.months_failed.join(', ') : 'None ✓'}`);
  console.log(`\nRows inserted this run:`);
  console.log(`  licitaciones:    ${report.total_licitaciones.toLocaleString()}`);
  console.log(`  historial_precios: ${report.total_historial.toLocaleString()}`);
  console.log(`\nCurrent DB totals:`);
  await printDbTotals();
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(console.error);
