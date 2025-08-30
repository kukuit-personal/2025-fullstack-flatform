export enum CurrencyEnum {
  VND = "VND",
  USD = "USD",
}

export const CURRENCY_OPTIONS = [
  { value: CurrencyEnum.VND, label: "VND" },
  { value: CurrencyEnum.USD, label: "USD" },
] as const;
