export const ALL_VARIANTS = ["voice", "chat"] as const;
type VariantTuple = typeof ALL_VARIANTS;
export type Variant = VariantTuple[number];
