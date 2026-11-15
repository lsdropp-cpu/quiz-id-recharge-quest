import { describe, test } from "node:test";
import { deepStrictEqual, ok } from "node:assert/strict";
import { billingAddress, billingCountries, validateBilling, regionRequired, postalCodeRequired } from "./checkout-billing";
const valid = { country: "US", firstName: "Ana", lastName: "Smith", address1: "10 Main Street", address2: "Apt 2", city: "Miami", state: "FL", zip: "33101", phone: "" };
describe("checkout billing", () => {
  test("requires billing name, street and city", () => {
    deepStrictEqual(validateBilling({ ...valid, firstName: "", lastName: "", address1: "", city: "" }), { firstName: "Ingresa tu nombre", lastName: "Ingresa tus apellidos", address1: "Ingresa tu dirección", city: "Ingresa tu ciudad" });
  });
  test("requires US region and postal code", () => {
    deepStrictEqual(validateBilling({ ...valid, state: "", zip: "" }), { state: "Ingresa tu estado o provincia", zip: "Ingresa tu código postal" });
  });
  test("accepts international alphanumeric postal codes", () => {
    deepStrictEqual(validateBilling({ ...valid, country: "GB", state: "", zip: "SW1A 1AA" }), {});
  });
  test("does not require invented postal codes for Bolivia", () => {
    deepStrictEqual(validateBilling({ ...valid, country: "BO", state: "", zip: "" }), {});
  });
  test("preserves the complete address sent with the card", () => {
    deepStrictEqual(billingAddress(valid), { line1: "10 Main Street", line2: "Apt 2", city: "Miami", state: "FL", postal_code: "33101", country: "US" });
  });
  test("includes Latin America, Europe and United States", () => {
    for (const country of ["US", "BR", "MX", "CL", "AR", "CO", "GT", "CR", "PR", "CU", "VE", "DE", "FR", "GB", "ES", "PT", "IT", "CH", "PL"]) ok(billingCountries.some(([code]) => code === country), country);
  });
  test("excludes markets outside Latin America, Europe and United States", () => {
    for (const country of ["CN", "JP", "IN", "AU", "NZ", "AE", "ZA", "CA"]) {
      ok(!billingCountries.some(([code]) => code === country), country);
      ok(validateBilling({ ...valid, country })["country"], country);
    }
  });
});
test("never substitutes city for a missing street", () => {
  deepStrictEqual(billingAddress({ ...valid, address1: "", address2: "", state: "", zip: "" }), { line1: "", line2: null, city: "Miami", state: null, postal_code: null, country: "US" });
});
test("region required only for US Brazil and Mexico", () => {
  deepStrictEqual(billingCountries.filter(([code]) => regionRequired(code)).map(([code]) => code).sort(), ["BR", "MX", "US"]);
});
test("countries without postal codes are exempt", () => {
  for (const country of ["BO", "BZ", "IE", "AG", "BS", "JM", "LC"]) ok(!postalCodeRequired(country));
  for (const country of ["GT", "CR", "DO", "PR", "US", "MX", "ES"]) ok(postalCodeRequired(country));
});
test("empty optional phone does not block billing", () => {
  deepStrictEqual(validateBilling({ ...valid, phone: "" }), {});
});
