import { describe, expect, it } from 'vitest';
import { nbmUrl, parseNbm, parsePrb } from './rate-sources';

const nbm = `<?xml version="1.0" encoding="UTF-8"?>
<ValCurs Date="04.11.2026" name="Official exchange rate">
  <Valute ID="47"><NumCode>978</NumCode><CharCode>EUR</CharCode><Nominal>1</Nominal><Name>Euro</Name><Value>20.1960</Value></Valute>
  <Valute ID="44"><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal><Name>US Dollar</Name><Value>18.0644</Value></Valute>
  <Valute ID="64"><NumCode>008</NumCode><CharCode>ALL</CharCode><Nominal>10</Nominal><Name>Lek</Name><Value>2.1000</Value></Valute>
</ValCurs>`;

const prb = `<div class='boxbg'><h8>Официальный курс</h8></div><div class='boxShadow1'><div align='center'><h8>c&nbsp;&nbsp;05.11.2026</h8></div><table class='simple-little-table' cellspacing='0'><tr>
<th>&nbsp;Флаг</th><th>&nbsp;Валюта&nbsp</th><th>Курс</th>
</tr><tr><td align='center'><img src="images/png/us.png"/></td><td align='center'><h12>USD</h12></td>
       <td width='10%'><h12>16.1000</h12></td>
       </tr><tr><td align='center'><img src="images/png/euro.png" /></td><td align='center'><h12>EUR</h12></td>
       <td width='10%'><h12>18.1206</h12></td>
       </tr></table>`;

describe('parseNbm', () => {
  it('reads USD and EUR to lei with the date', () => {
    expect(parseNbm(nbm)).toEqual([
      { date: '2026-11-04', base: 'EUR', quote: 'MDL', rate: '20.1960', source: 'nbm' },
      { date: '2026-11-04', base: 'USD', quote: 'MDL', rate: '18.0644', source: 'nbm' },
    ]);
  });

  it('fails without USD', () => {
    expect(() => parseNbm('<ValCurs Date="04.11.2026"></ValCurs>')).toThrow();
  });

  it('builds the URL for a date', () => {
    expect(nbmUrl(new Date('2026-11-04T00:00:00Z'))).toContain('date=04.11.2026');
  });
});

describe('parsePrb', () => {
  it('reads USD and EUR to PMR rubles with the date', () => {
    expect(parsePrb(prb)).toEqual([
      { date: '2026-11-05', base: 'USD', quote: 'PRB', rate: '16.1000', source: 'prb' },
      { date: '2026-11-05', base: 'EUR', quote: 'PRB', rate: '18.1206', source: 'prb' },
    ]);
  });

  it('fails on a changed page', () => {
    expect(() => parsePrb('<html>maintenance</html>')).toThrow();
  });
});
