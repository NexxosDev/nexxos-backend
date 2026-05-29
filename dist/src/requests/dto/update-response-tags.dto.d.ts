export declare const VALID_TAGS: readonly ["FAVORITO", "MEJOR_PRECIO", "EN_NEGOCIACION", "TIENE_REPUESTO", "DESCARTADO"];
export type ResponseTagValue = (typeof VALID_TAGS)[number];
export declare class UpdateResponseTagsDto {
    tags: string[];
}
