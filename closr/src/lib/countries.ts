// Countries by ISO 3166 code, with English names from the runtime's own list (Intl).
// Used by Profile ("Countries I can work in") and the jobs feed pipeline (scripts/jobs).

// Codes the runtime names that aren't current ISO countries: aliases (UK = GB), groups
// (EU, UN...) and withdrawn codes (DD was East Germany, YU Yugoslavia...).
const NOT_COUNTRIES = new Set(['UK', 'EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'DD', 'FX', 'CS', 'YU', 'SU', 'ZR', 'TP', 'BU', 'NT', 'AN', 'QU'])

export const COUNTRIES: { code: string; name: string }[] = (() => {
  const names = new Intl.DisplayNames(['en'], { type: 'region' })
  const out: { code: string; name: string }[] = []
  const seen = new Set<string>()
  for (let a = 65; a <= 90; a++)
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      if (NOT_COUNTRIES.has(code)) continue
      let name: string | undefined
      try {
        name = names.of(code)
      } catch {
        continue
      }
      if (!name || name === code || /unknown/i.test(name) || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      out.push({ code, name })
    }
  return out.sort((x, y) => x.name.localeCompare(y.name))
})()

const NAME = new Map(COUNTRIES.map((c) => [c.code, c.name]))
export const countryName = (code: string) => NAME.get(code) ?? code

// Name (and common short forms) → code.
export const COUNTRY_BY_NAME = new Map<string, string>(COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]))
for (const [k, v] of Object.entries({
  usa: 'US', us: 'US', 'u.s.': 'US', 'u.s.a.': 'US', 'united states of america': 'US', america: 'US',
  uk: 'GB', 'u.k.': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB', 'great britain': 'GB', britain: 'GB',
  uae: 'AE', deutschland: 'DE', 'the netherlands': 'NL', holland: 'NL', czechia: 'CZ', 'czech republic': 'CZ', 'south korea': 'KR', korea: 'KR',
  'hong kong sar': 'HK', türkiye: 'TR', turkey: 'TR', 'republic of ireland': 'IE',
}))
  COUNTRY_BY_NAME.set(k, v)
