import { NextResponse } from 'next/server';

/**
 * Helper: fetch ANAF API with a 5-second timeout.
 * Returns the normalised company object or throws on any failure.
 */
async function fetchFromANAF(cui) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify([{ cui: parseInt(cui, 10), data: todayStr }]),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`ANAF API a returnat status ${response.status}`);
    }

    const data = await response.json();

    if (data.found && data.found.length > 0) {
      const c = data.found[0].date_generale;
      return {
        name: c.denumire || '',
        cui: String(c.cui) || cui,
        euid: c.nrRegCom || '',
        address: c.adresa || '',
        caen: c.cod_CAEN || '',
        registrationDate: c.data_inregistrare || '',
        legalForm: c.forma_juridica || '',
      };
    }

    // Company not found in ANAF
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Helper: fetch from openapi.ro fallback.
 * Requires the OPENAPI_RO_KEY environment variable.
 * Returns the normalised company object or throws on any failure.
 */
async function fetchFromOpenAPI(cui) {
  const apiKey = process.env.OPENAPI_RO_KEY;
  if (!apiKey) {
    throw new Error('OPENAPI_RO_KEY nu este configurat');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.openapi.ro/api/companies/${cui}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAPI.ro a returnat status ${response.status}`);
    }

    const c = await response.json();

    if (!c || !c.denumire) {
      return null;
    }

    return {
      name: c.denumire || '',
      cui: String(c.cui || c.cif || '') || cui,
      euid: c.numar_reg_com || '',
      address: c.adresa || '',
      caen: c.cod_caen || '',
      registrationDate: c.data_inregistrare || '',
      legalForm: c.forma_juridica || '',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCui = searchParams.get('cui') || '';

  // Clean CUI (remove 'RO' prefix, and trim spaces)
  const cui = rawCui.toUpperCase().replace(/^RO/, '').trim();

  if (!cui || !/^\d+$/.test(cui)) {
    return NextResponse.json(
      {
        error:
          'CUI invalid. Introduceți doar cifre (ex. RO12345678 sau 12345678).',
      },
      { status: 400 },
    );
  }

  // ── 1. Try ANAF (primary) ──────────────────────────────────────────
  try {
    const result = await fetchFromANAF(cui);

    if (result) {
      return NextResponse.json(result);
    }
    // result === null  →  company not found, still try fallback below
  } catch (anafError) {
    console.error('ANAF lookup failed:', anafError.message);
  }

  // ── 2. Try openapi.ro (fallback) ───────────────────────────────────
  try {
    const result = await fetchFromOpenAPI(cui);

    if (result) {
      return NextResponse.json(result);
    }
  } catch (fallbackError) {
    console.error('OpenAPI.ro fallback failed:', fallbackError.message);
  }

  // ── 3. Both failed ────────────────────────────────────────────────
  return NextResponse.json(
    {
      error:
        'Nu am putut găsi date pentru acest CUI. Serverele ANAF și OpenAPI.ro nu au răspuns. Vă rugăm completați câmpurile manual.',
    },
    { status: 502 },
  );
}
