"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const KEYWORDS = {
    'Capó': ['capo', 'cofre', 'tapa motor', 'bonete', 'hood'],
    'Espejos': ['espejo', 'retrovisor', 'espejo lateral', 'espejo retrovisor', 'mirror'],
    'Guardafangos': ['guardafango', 'salpicadera', 'guardabarro', 'fender', 'tapabarros'],
    'Parachoques': ['parachoques', 'defensa', 'bumper', 'paragolpes', 'bomper', 'para choque'],
    'Puertas': ['puerta', 'puerta delantera', 'puerta trasera', 'door', 'chapa puerta', 'manilla puerta'],
    'Alternador': ['alternador', 'generador', 'carga bateria', 'alternator'],
    'Batería': ['bateria', 'acumulador', 'pila', 'battery', 'bateria carro'],
    'Bobinas': ['bobina', 'bobina encendido', 'coil', 'bobina ignicion'],
    'Motor de arranque': ['arranque', 'motor arranque', 'starter', 'marcha', 'burro de arranque', 'automático de arranque'],
    'Sensores': ['sensor', 'sensor oxigeno', 'sensor temperatura', 'sensor posicion', 'sensor velocidad', 'sonda lambda', 'sensor map', 'sensor tps', 'sensor abs'],
    'Filtro de aceite': ['filtro aceite', 'aceite', 'oil filter', 'filtro lubricante'],
    'Filtro de aire': ['filtro aire', 'air filter', 'filtro motor'],
    'Filtro de cabina': ['filtro cabina', 'filtro polen', 'filtro aire acondicionado', 'filtro ac', 'cabin filter'],
    'Filtro de combustible': ['filtro combustible', 'filtro gasolina', 'filtro diesel', 'fuel filter', 'filtro nafta'],
    'Calibradores': ['calibrador', 'caliper', 'mordaza', 'pinza freno', 'caliper freno'],
    'Discos': ['disco', 'disco freno', 'disco ventilado', 'rotor', 'brake disc'],
    'Líquido de frenos': ['liquido freno', 'fluido freno', 'brake fluid', 'dot 3', 'dot 4', 'aceite freno'],
    'Pastillas': ['pastilla', 'pastilla freno', 'taco', 'tacos', 'brake pad', 'balata', 'pad freno', 'fricciones'],
    'Tambores': ['tambor', 'tambor freno', 'brake drum', 'campana freno'],
    'Bombillos': ['bombillo', 'bombilla', 'foco', 'bulbo', 'led', 'halógeno', 'halogeno', 'xenon', 'luz'],
    'Exploradoras': ['exploradora', 'neblinero', 'antiniebla', 'fog light', 'luz niebla'],
    'Faros': ['faro', 'headlight', 'faro delantero', 'optica', 'luz delantera', 'cocuyo'],
    'Stops': ['stop', 'calavera', 'luz trasera', 'tail light', 'faro trasero', 'piloto trasero'],
    'Alfombras': ['alfombra', 'tapete', 'piso', 'floor mat', 'alfombrilla'],
    'Manillas': ['manilla', 'manija', 'tirador', 'handle', 'manilla interior', 'manilla exterior'],
    'Tablero': ['tablero', 'dashboard', 'panel', 'consola', 'instrumentos', 'cluster'],
    'Tapicería': ['tapiceria', 'forro', 'asiento', 'cuero', 'tela asiento', 'vestidura'],
    'Bielas': ['biela', 'connecting rod', 'biela motor'],
    'Bujías': ['bujia', 'spark plug', 'bujia encendido', 'bujia calentamiento', 'chispa'],
    'Cigüeñal': ['ciguenal', 'crankshaft', 'cigüeñal', 'eje ciguenal'],
    'Empaques': ['empaque', 'junta', 'gasket', 'empacadura', 'empaque culata', 'empaque tapa valvula', 'oring', 'sello'],
    'Pistones': ['piston', 'embolo', 'piston motor', 'ring', 'anillo piston'],
    'Válvulas': ['valvula', 'valvula motor', 'valvula admision', 'valvula escape', 'valve', 'resorte valvula'],
    'Cauchos': ['caucho', 'neumatico', 'llanta', 'goma', 'tire', 'cubierta', 'caucho carro'],
    'Rines': ['rin', 'aro', 'llanta', 'rim', 'rin aluminio', 'rin magnesio', 'wheel'],
    'Válvulas de aire': ['valvula aire', 'pico', 'valvula caucho', 'tire valve', 'valvula neumatico'],
    'Amortiguadores': ['amortiguador', 'shock', 'shocks', 'absorber', 'amortiguador delantero', 'amortiguador trasero', 'shock absorber'],
    'Barras': ['barra', 'barra estabilizadora', 'barra torsion', 'sway bar', 'barra direccion', 'link'],
    'Bujes': ['buje', 'bushing', 'buje barra', 'buje suspension', 'goma suspension', 'caucho suspension'],
    'Resortes': ['resorte', 'espiral', 'spring', 'muelle', 'resorte suspension', 'espiral suspension'],
    'Rótulas': ['rotula', 'terminal', 'ball joint', 'rotula direccion', 'rotula inferior', 'rotula superior', 'extremo direccion'],
    'Caja de cambios': ['caja cambios', 'transmision', 'caja velocidades', 'gearbox', 'caja automatica', 'caja sincrónica', 'caja mecanica'],
    'Cardán': ['cardan', 'eje cardan', 'cruceta', 'drive shaft', 'flecha cardan', 'junta cardan'],
    'Diferencial': ['diferencial', 'differential', 'corona', 'piñon', 'corona y piñon'],
    'Embrague': ['embrague', 'croche', 'clutch', 'plato presion', 'disco embrague', 'collarin', 'kit embrague', 'prensa embrague'],
};
async function main() {
    const subcats = await prisma.partSubcategory.findMany({ select: { id: true, name: true } });
    const nameToId = new Map(subcats.map((s) => [s.name, s.id]));
    await prisma.partKeyword.deleteMany({});
    let total = 0;
    for (const [subcatName, keywords] of Object.entries(KEYWORDS)) {
        const subcatId = nameToId.get(subcatName);
        if (!subcatId) {
            console.warn(`⚠️  Subcategory not found: ${subcatName}`);
            continue;
        }
        for (const kw of keywords) {
            await prisma.partKeyword.create({
                data: { subcategoryId: subcatId, keyword: kw.toLowerCase() },
            });
            total++;
        }
    }
    console.log(`✅ Seeded ${total} keywords for ${Object.keys(KEYWORDS).length} subcategories`);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-keywords.js.map