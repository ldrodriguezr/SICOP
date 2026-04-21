// @ts-nocheck — script de carga de datos, no forma parte del build de Next.js
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
const BATCH_SIZE = 100;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const report = {
  months_ok: [] as string[],
  months_failed: [] as string[],
  total_licitaciones: 0,
  total_historial: 0,
};

type ProcedureMeta = {
  institucion: string | null;
  titulo: string | null;
  codigo_cabie: string | null;
};

type AdjudicacionMeta = {
  ganador_cedula: string | null;
  ganador_nombre: string | null;
  monto_adjudicado: number | null;
};

function cleanValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/^"|"$/g, '').trim();
  return cleaned.length > 0 ? cleaned : null;
}

function getFirst(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = cleanValue(row[key]);
    if (value) return value;
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;

  let normalized = cleaned.replace(/\s+/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '');
  } else {
    normalized = normalized.replace(/,/g, '.');
  }

  normalized = normalized.replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimestamp(value: unknown): string | null {
  const cleaned = cleanValue(value);
  if (!cleaned) return null;
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseDateOnly(value: unknown): string | null {
  const timestamp = parseTimestamp(value);
  return timestamp ? timestamp.split('T')[0] : null;
}

function resolveBaseDir(extractPath: string) {
  const entries = fs.readdirSync(extractPath, { withFileTypes: true });
  const csvAtRoot = entries.some((entry) => entry.isFile() && entry.name.endsWith('.csv'));
  if (csvAtRoot) return extractPath;

  const directoryWithCsv = entries.find((entry) => {
    if (!entry.isDirectory()) return false;
    const nested = path.join(extractPath, entry.name);
    return fs
      .readdirSync(nested, { withFileTypes: true })
      .some((child) => child.isFile() && child.name.endsWith('.csv'));
  });

  return directoryWithCsv ? path.join(extractPath, directoryWithCsv.name) : extractPath;
}

function findExistingFile(baseDir: string, filenames: string[]) {
  for (const filename of filenames) {
    const filePath = path.join(baseDir, filename);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
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
      })
      .on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
};

async function upsertBatch(table: string, records: any[], onConflict?: string): Promise<number> {
  if (records.length === 0) return 0;

  const { error } = await supabase.from(table).upsert(records, {
    onConflict,
  });

  if (error) {
    console.error(`  [ERROR] upserting ${table}: ${error.message}`);
    return 0;
  }

  return records.length;
}

async function loadCabieMap(filePath: string) {
  const cabieByProcedure = new Map<string, string>();

  for await (const row of fs.createReadStream(filePath).pipe(csv({ separator: ';' }))) {
    const numeroProcedimiento = getFirst(row, ['NRO_SICOP', 'NUMERO_PROCEDIMIENTO']);
    const codigoCabie = getFirst(row, [
      'CODIGO_CABIE',
      'COD_CABIE',
      'CABIE',
      'CODIGO_CABYS',
      'COD_CABYS',
      'CABYS',
    ]);

    if (numeroProcedimiento && codigoCabie && !cabieByProcedure.has(numeroProcedimiento)) {
      cabieByProcedure.set(numeroProcedimiento, codigoCabie);
    }
  }

  return cabieByProcedure;
}

async function loadAdjudicacionesMap(filePath: string) {
  const adjudicacionesByProcedure = new Map<string, AdjudicacionMeta>();

  for await (const row of fs.createReadStream(filePath).pipe(csv({ separator: ';' }))) {
    const numeroProcedimiento = getFirst(row, ['NRO_SICOP', 'NUMERO_PROCEDIMIENTO']);
    if (!numeroProcedimiento) continue;

    adjudicacionesByProcedure.set(numeroProcedimiento, {
      ganador_cedula: getFirst(row, [
        'CEDULA_ADJUDICATARIO',
        'CEDULA_PROVEEDOR',
        'NUMERO_IDENTIFICACION_ADJUDICATARIO',
      ]),
      ganador_nombre: getFirst(row, [
        'NOMBRE_ADJUDICATARIO',
        'NOMBRE_PROVEEDOR',
        'ADJUDICATARIO_NM',
      ]),
      monto_adjudicado: parseNumber(
        getFirst(row, ['MONTO_ADJUDICADO', 'MONTO_TOTAL_ADJUDICADO', 'MONTO_TOTAL'])
      ),
    });
  }

  return adjudicacionesByProcedure;
}

async function processCarteles(
  filePath: string,
  cabieByProcedure: Map<string, string>,
  adjudicacionesByProcedure: Map<string, AdjudicacionMeta>
) {
  let totalInserted = 0;
  let batch: any[] = [];
  const procedureMeta = new Map<string, ProcedureMeta>();

  for await (const row of fs.createReadStream(filePath).pipe(csv({ separator: ';' }))) {
    const numeroProcedimiento = getFirst(row, ['NRO_SICOP', 'NUMERO_PROCEDIMIENTO']);
    if (!numeroProcedimiento) continue;

    const institucion =
      getFirst(row, [
        'NOMBRE_INSTITUCION',
        'INSTITUCION_NM',
        'DESC_INSTITUCION',
        'ENTIDAD_NOMBRE',
      ]) ??
      getFirst(row, ['CEDULA_INSTITUCION']) ??
      'Desconocida';

    const titulo =
      getFirst(row, ['CARTEL_NM', 'DESC_PROCEDIMIENTO', 'NOMBRE_PROCEDIMIENTO']) ?? 'Sin titulo';

    const adjudicacion = adjudicacionesByProcedure.get(numeroProcedimiento);
    const codigoCabie = cabieByProcedure.get(numeroProcedimiento) ?? null;

    procedureMeta.set(numeroProcedimiento, {
      institucion,
      titulo,
      codigo_cabie: codigoCabie,
    });

    batch.push({
      numero_procedimiento: numeroProcedimiento,
      tipo: getFirst(row, ['TIPO_PROCEDIMIENTO', 'TIPO_CONTRATACION']),
      titulo,
      descripcion: getFirst(row, ['DESC_PROCEDIMIENTO', 'DESCRIPCION']),
      institucion,
      fecha_publicacion: parseTimestamp(getFirst(row, ['FECHA_PUBLICACION'])),
      fecha_limite_oferta: parseTimestamp(
        getFirst(row, ['FECHAH_APERTURA', 'FECHA_RECEPCION_OFERTAS'])
      ),
      monto_estimado: parseNumber(getFirst(row, ['MONTO_EST', 'MONTO_ESTIMADO'])),
      moneda: getFirst(row, ['MONEDA']) ?? 'CRC',
      estado: adjudicacion ? 'adjudicado' : 'activo',
      codigo_cabie: codigoCabie,
      ganador_cedula: adjudicacion?.ganador_cedula ?? null,
      ganador_nombre: adjudicacion?.ganador_nombre ?? null,
      monto_adjudicado: adjudicacion?.monto_adjudicado ?? null,
      raw_data: row,
    });

    if (batch.length >= BATCH_SIZE) {
      totalInserted += await upsertBatch('licitaciones', batch, 'numero_procedimiento');
      batch = [];
    }
  }

  if (batch.length > 0) {
    totalInserted += await upsertBatch('licitaciones', batch, 'numero_procedimiento');
  }

  return { totalInserted, procedureMeta };
}

async function processHistorial(
  filePath: string,
  procedureMeta: Map<string, ProcedureMeta>,
  cabieByProcedure: Map<string, string>,
  fallbackYear: number
) {
  let totalInserted = 0;
  let batch: any[] = [];

  for await (const row of fs.createReadStream(filePath).pipe(csv({ separator: ';' }))) {
    const numeroProcedimiento = getFirst(row, ['NUMERO_PROCEDIMIENTO', 'NRO_SICOP']);
    const metadata = numeroProcedimiento ? procedureMeta.get(numeroProcedimiento) : null;
    const fechaAdjudicacion = parseDateOnly(
      getFirst(row, ['FECHA_ADJUDICACION', 'FECHA_PROVEEDOR_RECIBE_ORDEN', 'FECHA_ORDEN'])
    );

    batch.push({
      codigo_cabie:
        (numeroProcedimiento ? cabieByProcedure.get(numeroProcedimiento) : null) ??
        metadata?.codigo_cabie ??
        getFirst(row, [
          'CODIGO_CABIE',
          'COD_CABIE',
          'CABIE',
          'CODIGO_CABYS',
          'COD_CABYS',
          'CABYS',
        ]),
      descripcion_bien:
        getFirst(row, [
          'DESCRIPCION_BIEN',
          'DESC_BIEN_SERVICIO',
          'DESC_LINEA',
          'DESC_PROCEDIMIENTO',
        ]) ?? metadata?.titulo,
      institucion:
        metadata?.institucion ??
        getFirst(row, [
          'NOMBRE_INSTITUCION',
          'INSTITUCION_NM',
          'DESC_INSTITUCION',
          'ENTIDAD_NOMBRE',
        ]) ??
        getFirst(row, ['NRO_SICOP']),
      monto_adjudicado: parseNumber(
        getFirst(row, ['TOTAL_ORDEN', 'MONTO_ADJUDICADO', 'MONTO_TOTAL'])
      ),
      fecha_adjudicacion: fechaAdjudicacion,
      proveedor_nombre: getFirst(row, ['NOMBRE_PROVEEDOR', 'PROVEEDOR_NM']),
      cantidad: parseNumber(getFirst(row, ['CANTIDAD', 'QTY', 'CANTIDAD_ADJUDICADA'])),
      unidad: getFirst(row, ['UNIDAD_MEDIDA', 'UNIDAD', 'UNIDAD_COMPRA']),
      precio_unitario: parseNumber(
        getFirst(row, ['PRECIO_UNITARIO', 'MONTO_UNITARIO', 'USD_MONT'])
      ),
      año: fechaAdjudicacion ? new Date(fechaAdjudicacion).getUTCFullYear() : fallbackYear,
    });

    if (batch.length >= BATCH_SIZE) {
      totalInserted += await upsertBatch('historial_precios', batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    totalInserted += await upsertBatch('historial_precios', batch);
  }

  return totalInserted;
}

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
    if (!fs.existsSync(zipPath)) {
      console.log('=> Downloading...');
      await downloadFile(url, zipPath);
    } else {
      console.log('=> Using cached ZIP.');
    }

    console.log('=> Extracting...');
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const baseDir = resolveBaseDir(extractPath);
    console.log(`=> Using base directory: ${baseDir}`);

    const detalleLineasFile = findExistingFile(baseDir, [
      'DetalleLineaCartel.csv',
      'DetalleLineasCartel.csv',
      'DetalleLineaCarteles.csv',
    ]);
    const adjudicacionesFile = findExistingFile(baseDir, [
      'AdjudicacionesFirme.csv',
      'AdjudicacionFirme.csv',
    ]);
    const cartelesFile = findExistingFile(baseDir, ['DetalleCarteles.csv']);
    const ordenPedidoFile = findExistingFile(baseDir, ['OrdenPedido.csv']);

    const cabieByProcedure = detalleLineasFile
      ? await loadCabieMap(detalleLineasFile)
      : new Map<string, string>();
    const adjudicacionesByProcedure = adjudicacionesFile
      ? await loadAdjudicacionesMap(adjudicacionesFile)
      : new Map<string, AdjudicacionMeta>();

    if (cartelesFile) {
      console.log('=> Processing DetalleCarteles.csv -> licitaciones...');
      const { totalInserted, procedureMeta } = await processCarteles(
        cartelesFile,
        cabieByProcedure,
        adjudicacionesByProcedure
      );
      licitacionesCount = totalInserted;
      console.log(`   => licitaciones: ${licitacionesCount} rows upserted`);

      if (ordenPedidoFile) {
        console.log('=> Processing OrdenPedido.csv -> historial_precios...');
        historialCount = await processHistorial(
          ordenPedidoFile,
          procedureMeta,
          cabieByProcedure,
          year
        );
        console.log(`   => historial_precios: ${historialCount} rows inserted`);
      }
    } else if (ordenPedidoFile) {
      console.log('=> Processing OrdenPedido.csv -> historial_precios...');
      historialCount = await processHistorial(
        ordenPedidoFile,
        new Map<string, ProcedureMeta>(),
        cabieByProcedure,
        year
      );
      console.log(`   => historial_precios: ${historialCount} rows inserted`);
    }

    report.total_licitaciones += licitacionesCount;
    report.total_historial += historialCount;
    report.months_ok.push(yyyymm);
    console.log(`=> DONE ${yyyymm} ✓`);
  } catch (error: any) {
    console.error(`FAILED ${yyyymm}: ${error.message}`);
    report.months_failed.push(`${yyyymm} (${error.message})`);
  } finally {
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
  }
};

async function printDbTotals() {
  const { count: licitaciones } = await supabase
    .from('licitaciones')
    .select('*', { count: 'exact', head: true });
  const { count: historial } = await supabase
    .from('historial_precios')
    .select('*', { count: 'exact', head: true });

  console.log(`  DB Total licitaciones:      ${licitaciones?.toLocaleString() ?? '0'} rows`);
  console.log(`  DB Total historial_precios: ${historial?.toLocaleString() ?? '0'} rows`);
}

async function main() {
  const args = process.argv.slice(2);
  const startYear = parseInt(args[0]) || 2024;
  const startMonth = parseInt(args[1]) || 1;
  const endYear = parseInt(args[2]) || 2024;
  const endMonth = parseInt(args[3]) || 12;

  console.log(
    `\nSTARTING SICOP DATA LOAD: ${startYear}-${String(startMonth).padStart(2, '0')} -> ${endYear}-${String(endMonth).padStart(2, '0')}`
  );

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;

    for (let month = monthStart; month <= monthEnd; month++) {
      await processMonth(year, month);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('FINAL REPORT');
  console.log(`${'='.repeat(50)}`);
  console.log(`Months OK    : [${report.months_ok.join(', ')}]`);
  console.log(
    `Months FAILED: ${report.months_failed.length > 0 ? report.months_failed.join(', ') : 'None'}`
  );
  console.log('\nRows inserted this run:');
  console.log(`  licitaciones:      ${report.total_licitaciones.toLocaleString()}`);
  console.log(`  historial_precios: ${report.total_historial.toLocaleString()}`);
  console.log('\nCurrent DB totals:');
  await printDbTotals();
  console.log(`${'='.repeat(50)}\n`);
}

main().catch(console.error);
