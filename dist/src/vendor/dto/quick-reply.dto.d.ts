export declare class CreateQuickReplyDto {
    messageText: string;
}
export declare class UpdateQuickReplyDto {
    messageText?: string;
}
declare class ReorderItemDto {
    id: string;
    order: number;
}
export declare class ReorderQuickRepliesDto {
    items: ReorderItemDto[];
}
export {};
