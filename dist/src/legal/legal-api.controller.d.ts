import { LegalService } from './legal.service';
export declare class LegalApiController {
    private readonly legalService;
    private readonly logger;
    constructor(legalService: LegalService);
    findAll(): Promise<{
        id: string;
        key: string;
        title: string;
        updatedAt: Date;
    }[]>;
    getFaq(): Promise<any>;
    findByKey(key: string): Promise<{
        id: string;
        createdAt: Date;
        key: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
    update(key: string, body: {
        content: string;
        title?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        key: string;
        title: string;
        content: string;
        updatedAt: Date;
    }>;
}
