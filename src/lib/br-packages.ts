// Brazilian PIX packages. Prices are charged server-side from this list.
export const brPackages = [
  { diamonds: "5.600", bonus: "1.200", badge: "MELHOR VALOR", cents: 1990 },
  { diamonds: "11.200", bonus: "2.240", badge: "MAIS POPULAR", cents: 2990 },
  { diamonds: "22.400", bonus: "4.480", badge: "MELHOR OFERTA", cents: 3990 },
  { diamonds: "29.500", bonus: "5.900", badge: "MÁXIMO BENEFÍCIO", cents: 4990 },
  { diamonds: "39.200", bonus: "7.840", badge: "SUPER PACOTE", cents: 5990 },
  { diamonds: "56.000", bonus: "11.200", badge: "MEGA PACOTE", cents: 6990 },
] as const;

export const formatBRL = (cents: number) =>
  "R$" + (cents / 100).toFixed(2).replace(".", ",");
