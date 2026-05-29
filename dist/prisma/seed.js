"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const roles = ['CLIENTE', 'VENDEDOR', 'ADMIN'];
    for (const name of roles) {
        await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    }
    const clienteRole = await prisma.role.findUnique({ where: { name: 'CLIENTE' } });
    const vendedorRole = await prisma.role.findUnique({ where: { name: 'VENDEDOR' } });
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const statesData = {
        'Distrito Capital': ['Libertador'],
        'Miranda': ['Sucre', 'Baruta', 'Chacao', 'El Hatillo', 'Plaza'],
        'Carabobo': ['Valencia', 'Naguanagua', 'San Diego', 'Libertador'],
        'Zulia': ['Maracaibo', 'San Francisco', 'Cabimas', 'Lagunillas'],
        'Aragua': ['Girardot', 'Santiago Mari\u00f1o', 'Libertador', 'Zamora'],
        'Lara': ['Iribarren', 'Palavecino', 'Cabudare'],
        'T\u00e1chira': ['San Crist\u00f3bal', 'C\u00e1rdenas', 'Jun\u00edn'],
        'Anzo\u00e1tegui': ['Sotillo', 'Urbaneja', 'Bol\u00edvar', 'Sim\u00f3n Rodr\u00edguez'],
        'Bol\u00edvar': ['Caron\u00ed', 'Heres', 'Piar'],
        'M\u00e9rida': ['Libertador', 'Campo El\u00edas', 'Sucre'],
    };
    const stateMap = {};
    const municipalityMap = {};
    for (const [stateName, municipalities] of Object.entries(statesData)) {
        const state = await prisma.state.upsert({
            where: { name: stateName },
            update: {},
            create: { name: stateName },
        });
        stateMap[stateName] = state.id;
        for (const munName of municipalities) {
            const mun = await prisma.municipality.upsert({
                where: { stateId_name: { stateId: state.id, name: munName } },
                update: {},
                create: { stateId: state.id, name: munName },
            });
            municipalityMap[`${stateName}-${munName}`] = mun.id;
        }
    }
    const vehicleData = {
        'Chevrolet': ['Aveo', 'Spark', 'Onix', 'Cruze', 'Sail', 'Captiva', 'Tracker', 'Silverado', 'Grand Vitara', 'Corsa', 'Optra', 'Malibu', 'Tahoe', 'Trailblazer', 'Orlando'],
        'Hyundai': ['Accent', 'Elantra', 'Tucson', 'Santa Fe', 'Grand i10', 'Creta', 'H100', 'Porter', 'Verna', 'Sonata', 'i10', 'ix35', 'Starex'],
        'Mazda': ['2', '3', '6', 'CX-3', 'CX-5', 'CX-7', 'BT-50', 'Demio', 'CX-30', 'CX-9'],
        'Toyota': ['Corolla', 'Yaris', 'Hilux', 'Fortuner', 'RAV4', 'Camry', 'Prado', 'Samurai', 'Terios', '4Runner', 'Land Cruiser', 'Machito', 'Starlet', 'Rush'],
        'Nissan': ['Versa', 'Sentra', 'Tiida', 'March', 'X-Trail', 'Frontier', 'Kicks', 'Patrol', 'Tsuru', 'Pathfinder', 'Navara', 'Almera', 'Qashqai'],
        'Ford': ['Fiesta', 'Focus', 'Mustang', 'Explorer', 'Ranger', 'Escape', 'Edge', 'F-150', 'EcoSport', 'Bronco', 'Expedition', 'Maverick', 'Fusion'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Fit', 'Pilot', 'Odyssey', 'City', 'WR-V', 'BR-V'],
        'Volkswagen': ['Gol', 'Polo', 'Vento', 'Jetta', 'Amarok', 'Tiguan', 'Saveiro', 'Bora', 'Golf', 'T-Cross', 'Taos', 'Passat'],
        'Kia': ['Rio', 'Picanto', 'Sportage', 'Sorento', 'Cerato', 'Carnival', 'Optima', 'Soul', 'Seltos', 'Forte', 'Stonic'],
        'Renault': ['Logan', 'Sandero', 'Duster', 'Oroch', 'Kwid', 'Stepway', 'Clio', 'Megane', 'Captur', 'Koleos', 'Symbol'],
        'Suzuki': ['Swift', 'Alto', 'Celerio', 'Vitara', 'Grand Vitara', 'Jimny', 'S-Cross', 'Baleno', 'Ertiga'],
        'Fiat': ['Argo', 'Cronos', 'Mobi', 'Pulse', 'Strada', 'Toro', 'Palio', 'Siena', 'Uno', '500', 'Ducato'],
        'Jeep': ['Renegade', 'Compass', 'Grand Cherokee', 'Wrangler', 'Cherokee', 'Gladiator', 'Liberty'],
        'Mitsubishi': ['Lancer', 'Outlander', 'ASX', 'L200', 'Montero', 'Galant', 'Space Wagon', 'Eclipse Cross', 'Nativa', 'Signo'],
        'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X3', 'X5', 'X6', 'Z4'],
        'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'GLA', 'GLC', 'GLE', 'Sprinter', 'Clase S', 'Vito', 'CLA'],
        'Audi': ['A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'Q8', 'A6', 'TT'],
        'Peugeot': ['208', '308', '2008', '3008', 'Partner', '307', '206', '207', '408', '5008'],
        'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Ram 1500', 'Caliber', 'Forza', 'Attitude', 'Neon'],
        'Subaru': ['Impreza', 'Forester', 'Outback', 'XV', 'WRX', 'Legacy', 'BRZ'],
        'Volvo': ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V40', 'V60'],
        'Lexus': ['IS', 'ES', 'RX', 'NX', 'UX', 'GX', 'LX'],
        'Porsche': ['Cayenne', 'Macan', '911', 'Panamera', 'Boxster', 'Taycan'],
        'Land Rover': ['Range Rover', 'Discovery', 'Defender', 'Evoque', 'Sport', 'Velar', 'Freelander'],
        'Jaguar': ['XE', 'XF', 'F-Pace', 'E-Pace', 'F-Type', 'XJ'],
        'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
        'Chery': ['QQ', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 5', 'Tiggo 7', 'Tiggo 8', 'Arrizo 3', 'Arrizo 5', 'Face', 'Orinoco', 'X1'],
        'Great Wall': ['Wingle', 'Hover', 'Steed', 'Poer', 'Haval H6', 'Haval Jolion'],
        'JAC': ['J2', 'J3', 'J4', 'J7', 'S2', 'S3', 'S5', 'T6', 'T8', 'Sei 3', 'Refine'],
        'Changan': ['CS35', 'CS55', 'CS75', 'Alsvin', 'Eado', 'CX70', 'CS15'],
        'DFSK': ['C31', 'C35', 'Glory', 'K01', 'K05', 'Glory 580', 'Glory 560', 'EC35'],
        'Zotye': ['Z200', 'T600', 'T700', 'Z300', 'SR9'],
        'Haval': ['H6', 'Jolion', 'H2', 'H9', 'Dargo', 'F7'],
        'MG': ['ZS', 'HS', 'GT', '3', '5', 'RX5', 'Marvel R'],
        'Geely': ['Emgrand', 'Coolray', 'Azkarra', 'Okavango', 'GX3 Pro'],
        'RAM': ['1500', '2500', '3500', '700', 'ProMaster'],
        'Isuzu': ['D-Max', 'NHR', 'NKR', 'NPR', 'MU-X'],
        'Iveco': ['Daily', 'Eurocargo', 'Trakker', 'Stralis'],
        'Citroën': ['C3', 'C4', 'C-Elysée', 'Berlingo', 'Xsara', 'C4 Cactus', 'C3 Aircross'],
    };
    const vehicleModelMap = {};
    for (const [brandName, models] of Object.entries(vehicleData)) {
        const brand = await prisma.vehicleBrand.upsert({
            where: { name: brandName },
            update: {},
            create: { name: brandName },
        });
        for (const modelName of models) {
            const model = await prisma.vehicleModel.upsert({
                where: { brandId_name: { brandId: brand.id, name: modelName } },
                update: {},
                create: { brandId: brand.id, name: modelName },
            });
            vehicleModelMap[`${brandName}-${modelName}`] = model.id;
        }
    }
    const partData = {
        'Motor': ['Pistones', 'Bielas', 'Cig\u00fce\u00f1al', 'V\u00e1lvulas', 'Buj\u00edas', 'Empaques'],
        'Transmisi\u00f3n': ['Caja de cambios', 'Embrague', 'Card\u00e1n', 'Diferencial'],
        'Suspensi\u00f3n': ['Amortiguadores', 'Resortes', 'R\u00f3tulas', 'Bujes', 'Barras'],
        'Frenos': ['Pastillas', 'Discos', 'Tambores', 'L\u00edquido de frenos', 'Calibradores'],
        'El\u00e9ctrico': ['Alternador', 'Motor de arranque', 'Bater\u00eda', 'Bobinas', 'Sensores'],
        'Carrocer\u00eda': ['Parachoques', 'Guardafangos', 'Cap\u00f3', 'Puertas', 'Espejos'],
        'Iluminaci\u00f3n': ['Faros', 'Stops', 'Bombillos', 'Exploradoras'],
        'Interior': ['Tapicer\u00eda', 'Tablero', 'Alfombras', 'Manillas'],
        'Neum\u00e1ticos': ['Cauchos', 'Rines', 'V\u00e1lvulas de aire'],
        'Filtros': ['Filtro de aceite', 'Filtro de aire', 'Filtro de combustible', 'Filtro de cabina'],
    };
    const subcategoryMap = {};
    for (const [catName, subcats] of Object.entries(partData)) {
        const category = await prisma.partCategory.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName },
        });
        for (const subName of subcats) {
            const sub = await prisma.partSubcategory.upsert({
                where: { categoryId_name: { categoryId: category.id, name: subName } },
                update: {},
                create: { categoryId: category.id, name: subName },
            });
            subcategoryMap[`${catName}-${subName}`] = sub.id;
        }
    }
    await prisma.plan.upsert({
        where: { slug: 'beta' },
        update: {},
        create: {
            name: 'Beta',
            slug: 'beta',
            description: 'Plan Beta para vendors tempranos con acceso ilimitado temporal',
            solicitudesMensuales: -1,
            prioridad: 2,
            precioMensual: 0,
            precioAnual: 0,
            comisionPorcentaje: 0,
            visibleEnApp: false,
            isActive: true,
        },
    });
    await prisma.plan.upsert({
        where: { slug: 'gratuito' },
        update: {},
        create: {
            name: 'Gratuito',
            slug: 'gratuito',
            description: 'Plan gratuito con funcionalidades básicas',
            solicitudesMensuales: 50,
            prioridad: 1,
            precioMensual: 0,
            precioAnual: 0,
            comisionPorcentaje: 0,
            visibleEnApp: true,
            isActive: true,
        },
    });
    await prisma.plan.upsert({
        where: { slug: 'pro' },
        update: {},
        create: {
            name: 'Pro',
            slug: 'pro',
            description: 'Plan Pro con mayor capacidad de solicitudes',
            solicitudesMensuales: 500,
            prioridad: 3,
            precioMensual: 19.99,
            precioAnual: 199.99,
            comisionPorcentaje: 5,
            visibleEnApp: false,
            isActive: true,
        },
    });
    await prisma.plan.upsert({
        where: { slug: 'premium' },
        update: {},
        create: {
            name: 'Premium',
            slug: 'premium',
            description: 'Plan Premium con solicitudes ilimitadas y máxima prioridad',
            solicitudesMensuales: -1,
            prioridad: 4,
            precioMensual: 49.99,
            precioAnual: 499.99,
            comisionPorcentaje: 3,
            visibleEnApp: false,
            isActive: true,
        },
    });
    const hashedPassword = await bcrypt.hash('johndoe123', 10);
    const testUser = await prisma.user.upsert({
        where: { email: 'john@doe.com' },
        update: {},
        create: {
            email: 'john@doe.com',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Doe',
            name: 'John Doe',
            phone: '+58412000000',
            documentId: 'V-12345678',
        },
    });
    for (const role of [clienteRole, vendedorRole, adminRole]) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: testUser.id, roleId: role.id } },
            update: {},
            create: { userId: testUser.id, roleId: role.id },
        });
    }
    const dcStateId = stateMap['Distrito Capital'];
    const libertadorMunId = municipalityMap['Distrito Capital-Libertador'];
    const vendor = await prisma.vendor.upsert({
        where: { userId: testUser.id },
        update: {},
        create: {
            userId: testUser.id,
            businessName: 'NEXXOS Test',
            rif: 'J-12345678-9',
            country: 'Venezuela',
            state: 'Distrito Capital',
            city: 'Caracas',
            municipality: 'Libertador',
            parish: 'El Recreo',
            street: 'Av. Francisco de Miranda',
            postalCode: '1060',
            latitude: 10.4806,
            longitude: -66.9036,
            fullAddress: 'Av. Francisco de Miranda, El Recreo, Libertador, Caracas, Distrito Capital, Venezuela',
            isAvailable: true,
        },
    });
    const vendorModels = [
        vehicleModelMap['Toyota-Corolla'],
        vehicleModelMap['Ford-F-150'],
        vehicleModelMap['Chevrolet-Cruze'],
        vehicleModelMap['Honda-Civic'],
    ].filter(Boolean);
    for (const modelId of vendorModels) {
        await prisma.vendorVehicleModel.upsert({
            where: { vendorId_vehicleModelId: { vendorId: vendor.id, vehicleModelId: modelId } },
            update: {},
            create: { vendorId: vendor.id, vehicleModelId: modelId },
        });
    }
    const vendorSubcats = [
        subcategoryMap['Motor-Buj\u00edas'],
        subcategoryMap['Frenos-Pastillas'],
        subcategoryMap['Frenos-Discos'],
        subcategoryMap['Filtros-Filtro de aceite'],
        subcategoryMap['Filtros-Filtro de aire'],
    ].filter(Boolean);
    for (const subId of vendorSubcats) {
        await prisma.vendorPartSubcategory.upsert({
            where: { vendorId_partSubcategoryId: { vendorId: vendor.id, partSubcategoryId: subId } },
            update: {},
            create: { vendorId: vendor.id, partSubcategoryId: subId },
        });
    }
    await prisma.vendorMetrics.upsert({
        where: { vendorId: vendor.id },
        update: {},
        create: { vendorId: vendor.id },
    });
    console.log('Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map