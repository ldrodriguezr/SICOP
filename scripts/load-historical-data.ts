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
 * Upserts a batch of records into a Supabase table
 */
async function upsertBatch(table: string, records: any[]) {
  if (records.length === 0) return;
  const { error } = await supabase.from(table).upsert(records, { onConflict: table === 'licitaciones' ? 'numero_procedimiento' : undefined });
  if (error) {
    console.error(`Error upserting to ${table}:`, error.message);
  } else {
    console.log(`Successfully upserted ${records.length} records to ${table}`);
  }
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

  try {
    if (!fs.existsSync(zipPath)) {
      console.log(`=> Downloading ${url}...`);
      await downloadFile(url, zipPath);
    }

    console.log(`=> Extracting...`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const baseDir = path.join(extractPath, yyyymm);
    if (!fs.existsSync(baseDir)) {
      throw new Error(`Data folder ${yyyymm} not found in zip`);
    }

    // 1. Process DetalleCarteles.csv for Tenders
    const cartelesFile = path.join(baseDir, 'DetalleCarteles.csv');
    if (fs.existsSync(cartelesFile)) {
      console.log(`=> Processing Tenders (DetalleCarteles.csv)...`);
      const tenders: any[] = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(cartelesFile)
          .pipe(csv({ separator: ';' }))
          .on('data', (row) => {
            tenders.push({
              numero_procedimiento: row.NRO_SICOP,
              tipo: row.TIPO_PROCEDIMIENTO,
              titulo: row.CARTEL_NM || 'Sin título',
              institucion: row.CEDULA_INSTITUCION || 'Desconocida',
              fecha_publicacion: row.FECHA_PUBLICACION ? new Date(row.FECHA_PUBLICACION).toISOString() : null,
              fecha_limite_oferta: row.FECHAH_APERTURA ? new Date(row.FECHAH_APERTURA).toISOString() : null,
              monto_estimado: parseFloat(row.MONTO_EST) || 0,
              estado: 'activo',
              raw_data: row
            });
            if (tenders.length >= 200) {
              const batch = [...tenders];
              tenders.length = 0;
              upsertBatch('licitaciones', batch);
            }
          })
          .on('end', async () => {
            await upsertBatch('licitaciones', tenders);
            resolve(true);
          })
          .on('error', reject);
      });
    }

    // 2. Process OrdenPedido.csv for Price History
    const ordersFile = path.join(baseDir, 'OrdenPedido.csv');
    if (fs.existsSync(ordersFile)) {
      console.log(`=> Processing Price History (OrdenPedido.csv)...`);
      const history: any[] = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(ordersFile)
          .pipe(csv({ separator: ';' }))
          .on('data', (row) => {
            // Note: We'd ideally join with DetalleLineaCartel for CABIE coding, 
            // but for MVP we use the description available in the order or procurement title
            history.push({
              codigo_cabie: row.NUMERO_PROCEDIMIENTO, // Placeholder or mapping if available
              descripcion_bien: row.DESC_PROCEDIMIENTO,
              institucion: row.NRO_SICOP, // Often contains institution info or we link via proc ID
              monto_adjudicado: parseFloat(row.TOTAL_ORDEN) || 0,
              fecha_adjudicacion: row.FECHA_PROVEEDOR_RECIBE_ORDEN ? new Date(row.FECHA_PROVEEDOR_RECIBE_ORDEN).toISOString() : null,
              proveedor_nombre: row.NOMBRE_PROVEEDOR,
              año: year
            });
            if (history.length >= 200) {
              const batch = [...history];
              history.length = 0;
              upsertBatch('historial_precios', batch);
            }
          })
          .on('end', async () => {
            await upsertBatch('historial_precios', history);
            resolve(true);
          })
          .on('error', reject);
      });
    }

    console.log(`=> Finished ${yyyymm}`);
  } catch (error) {
    console.error(`FAILED ${yyyymm}:`, error);
  } finally {
    // Optional: Keep zip to avoid re-downloading if script restarts, but clean extracted folder
    if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
  }
};

async function main() {
  const args = process.argv.slice(2);
  const startYear = parseInt(args[0]) || 2024;
  const startMonth = parseInt(args[1]) || 1;
  const endYear = parseInt(args[2]) || 2024;
  const endMonth = parseInt(args[3]) || 1;

  for (let y = startYear; y <= endYear; y++) {
    const mStart = (y === startYear) ? startMonth : 1;
    const mEnd = (y === endYear) ? endMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      await processMonth(y, m);
    }
  }
  
  console.log('\n--- ALL DATA PROCESSING COMPLETED ---');
}

main().catch(console.error);
