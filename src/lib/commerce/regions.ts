/**
 * CEP → UF pelas faixas dos Correios (5 primeiros dígitos). Usado só para regras comerciais por região
 * (ex.: frete grátis só para o Sudeste). O endereço continua vindo do ViaCEP / do formulário.
 */
const RANGES: [number, number, string][] = [
  [1000, 19999, "SP"], [20000, 28999, "RJ"], [29000, 29999, "ES"], [30000, 39999, "MG"], [40000, 48999, "BA"], [49000, 49999, "SE"],
  [50000, 56999, "PE"], [57000, 57999, "AL"], [58000, 58999, "PB"], [59000, 59999, "RN"], [60000, 63999, "CE"], [64000, 64999, "PI"],
  [65000, 65999, "MA"], [66000, 68899, "PA"], [68900, 68999, "AP"], [69000, 69299, "AM"], [69300, 69399, "RR"], [69400, 69899, "AM"],
  [69900, 69999, "AC"], [70000, 72799, "DF"], [72800, 72999, "GO"], [73000, 73699, "DF"], [73700, 76799, "GO"], [76800, 76999, "RO"],
  [77000, 77999, "TO"], [78000, 78899, "MT"], [79000, 79999, "MS"], [80000, 87999, "PR"], [88000, 89999, "SC"], [90000, 99999, "RS"],
];

export const REGIONS: Record<string, string[]> = {
  norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "centro-oeste": ["DF", "GO", "MT", "MS"],
  sudeste: ["ES", "MG", "RJ", "SP"],
  sul: ["PR", "RS", "SC"],
};
const REGION_LABEL: Record<string, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };

export function ufFromCep(cep: string | null | undefined): string | null {
  const d = (cep ?? "").replace(/\D/g, "");
  if (d.length !== 8) return null;
  const n = Number(d.slice(0, 5));
  return RANGES.find(([a, b]) => n >= a && n <= b)?.[2] ?? null;
}

/** lista de regiões/UFs da regra → conjunto de UFs */
export const expandRegions = (regions: string[]) => new Set(regions.flatMap((r) => REGIONS[r.toLowerCase()] ?? [r.toUpperCase()]));
/** "Sudeste e PR" */
export const regionsLabel = (regions: string[]) => {
  const names = regions.map((r) => REGION_LABEL[r.toLowerCase()] ?? r.toUpperCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}` : (names[0] ?? "");
};
