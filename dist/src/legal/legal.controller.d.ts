import type { Response } from 'express';
import { LegalService } from './legal.service';
export declare class LegalHtmlController {
    private readonly legalService;
    private readonly logger;
    constructor(legalService: LegalService);
    getTerminos(res: Response): Promise<void>;
    getPrivacidad(res: Response): Promise<void>;
    getFaq(res: Response): Promise<void>;
    getSobreNosotros(res: Response): Promise<void>;
    private wrapHtml;
}
