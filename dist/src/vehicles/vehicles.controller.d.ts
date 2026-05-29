import { VehiclesService } from './vehicles.service';
import { DecodeVinDto } from './dto/decode-vin.dto';
export declare class VehiclesController {
    private readonly vehiclesService;
    constructor(vehiclesService: VehiclesService);
    decodeVin(dto: DecodeVinDto): Promise<import("./vehicles.service").VinDecodeResult>;
}
