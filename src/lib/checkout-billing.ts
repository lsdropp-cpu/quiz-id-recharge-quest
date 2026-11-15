// Checkout markets: Latin America (including the Caribbean), Europe and the US.
// ISO 3166-1 regions; names are localized without a browser-only dependency.
const countryCodes = "US AR BO BR CL CO CR CU DO EC SV GT HT HN MX NI PA PY PE PR UY VE BZ GY SR AG AW BS BB BQ KY CW DM GD GP JM MQ MS BL KN LC MF VC SX TT TC VG VI GF AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM TR UA VA".split(" ");
const names = new Intl.DisplayNames(["es"], { type: "region" });
export const billingCountries = countryCodes.map((code) => [code, names.of(code) || code] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], "es"));
const noPostalCode = new Set(["AE", "AG", "AO", "AW", "BF", "BI", "BJ", "BO", "BS", "BW", "BZ", "CD", "CF", "CG", "CI", "CK", "CM", "CW", "DJ", "DM", "ER", "FJ", "GD", "GH", "GM", "GN", "GQ", "GY", "HK", "IE", "JM", "KE", "KI", "KM", "KN", "LC", "ML", "MO", "MR", "MS", "MW", "NR", "NU", "QA", "RW", "SB", "SC", "SL", "SO", "SR", "ST", "SX", "SY", "TD", "TG", "TK", "TL", "TO", "TT", "TV", "TZ", "UG", "VU", "YE", "ZW"]);
export const postalCodeRequired = (country: string) => !noPostalCode.has(country);
export const regionRequired = (country: string) => ["US", "BR", "MX"].includes(country);

export type BillingForm = { country: string; firstName: string; lastName: string; address1: string; address2: string; city: string; state: string; zip: string; phone: string };
export function validateBilling(values: BillingForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!countryCodes.includes(values.country)) errors["country"] = "Selecciona tu país";
  for (const [key, message] of [["firstName", "Ingresa tu nombre"], ["lastName", "Ingresa tus apellidos"], ["address1", "Ingresa tu dirección"], ["city", "Ingresa tu ciudad"]] as const) {
    if (!values[key].trim()) errors[key] = message;
  }
  if (regionRequired(values.country) && !values.state.trim()) errors["state"] = "Ingresa tu estado o provincia";
  if (postalCodeRequired(values.country) && !values.zip.trim()) errors["zip"] = "Ingresa tu código postal";
  return errors;
}
export function billingAddress(values: BillingForm) {
  return { line1: values.address1.trim(), line2: values.address2.trim() || null, city: values.city.trim(), state: values.state.trim() || null, postal_code: values.zip.trim() || null, country: values.country };
}