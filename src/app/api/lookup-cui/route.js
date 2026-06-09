import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawCui = searchParams.get('cui') || '';
  
  // Clean CUI (remove 'RO' prefix, and trim spaces)
  const cui = rawCui.toUpperCase().replace(/^RO/, '').trim();
  
  if (!cui || !/^\d+$/.test(cui)) {
    return NextResponse.json(
      { error: 'CUI invalid. Introduceți doar cifre (ex. RO12345678 sau 12345678).' },
      { status: 400 }
    );
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Call ANAF REST API
    const response = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify([
        {
          cui: parseInt(cui, 10),
          data: todayStr,
        }
      ]),
    });

    if (!response.ok) {
      throw new Error(`ANAF API returned status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.found && data.found.length > 0) {
      const companyInfo = data.found[0].date_generale;
      return NextResponse.json({
        name: companyInfo.denumire || '',
        cui: String(companyInfo.cui) || cui,
        euid: companyInfo.nrRegCom || '',
        address: companyInfo.adresa || '',
        caen: companyInfo.cod_CAEN || '',
        registrationDate: companyInfo.data_inregistrare || '',
        legalForm: companyInfo.forma_juridica || '',
      });
    } else {
      return NextResponse.json(
        { error: 'Compania nu a fost găsită. Verificați CUI-ul introdus.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in CUI lookup:', error);
    return NextResponse.json(
      { error: 'Eroare la conectarea cu serverele ANAF. Încercați din nou sau completați manual.' },
      { status: 500 }
    );
  }
}
