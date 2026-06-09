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
    const response = await fetch('https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    
    if (data.cod === 200 && data.found && data.found.length > 0) {
      const companyInfo = data.found[0].date_generale;
      return NextResponse.json({
        name: companyInfo.denumire || '',
        cui: String(companyInfo.cui) || cui,
        euid: companyInfo.nrRegCom || '',
        address: companyInfo.adresa || '',
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
