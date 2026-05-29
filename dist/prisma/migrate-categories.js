"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CSV_RAW = `Partes Electricas;Alternadores y Componentes;alternador, alternator, malta, alterna, cargador, dinamo
Partes Electricas;Cable Automotriz;cable automotriz, cable electrico, mazo cables, cable bateria, cable tierra
Partes Electricas;Cables de Bujias;cable bujia, cables bujias, spark plug wire, juego cables bujias, cable encendido
Partes Electricas;Conmutadores;conmutador, switch, interruptor, conmutador direccionales, palanca de luces
Partes Electricas;Distribuidores y Componentes;distribuidor, capa distribuidor, rotor, tapa distribuidor, delco
Partes Electricas;Fusibles;fusible, fusibles, fuse, fusible automotriz, caja fusibles
Partes Electricas;Modulos de Encendido;modulo encendido, ignition module, modulo, centralita, computadora
Partes Electricas;Motores Electricos;motor electrico, electric motor, motor ventilador, motor levanta vidrios
Partes Electricas;Palancas;palanca, perilla palanca, pomo, palanca de cambios, mango palanca
Partes Electricas;Pitos y Cornetas;pito, corneta, horn, claxon, bocina, pito electrico, doble corneta
Partes Electricas;Relay y Flasher;relay, rele, flasher, relé, relevador, flasher direccional
Partes Electricas;Arranques y Componentes;arranque, starter, motor arranque, burro de arranque, catalina, solenoide
Partes Electricas;Sensores;sensor, sensores, sensor oxigeno, sonda lambda, TPS, MAP, CKP
Partes Electricas;Sockets o Conectores;socket, conector, socate, conector electrico, plug, hembra, macho
Partes Electricas;Terminales de Conexion;terminal, terminales electricos, conectores, punta cable, ojal, horquilla
Partes Electricas;Bomba Limpiaparabrisas;bomba limpiaparabrisas, bomba agua, bomba lavaparabrisas, motor limpia
Partes Electricas;Clindro de Encendido;cilindro encendido, ignition switch, switch encendido, tambor, llave contacto
Partes Electricas;Solenoides;solenoide, solenoide arranque, solenoide marcha, rele de arranque
Partes Electricas;Switch de Luz;switch luz, interruptor luces, perilla luces, comando luces
Partes Electricas;Bobinas Captadoras;bobina captadora, pick up coil, sensor posicion, captador distribuidor
Partes Electricas;Cinta Airbag;cinta airbag, cable airbag, espiral airbag, resorte de aire, clock spring
Partes Electricas;Electroventiladores;electroventilador, electric fan, ventilador radiador, electro ventilador, fan cooler
Partes Electricas;Barras y Cintas Led;barra led, cinta led, light bar, led strip, luz led
Partes Electricas;Carbones;carbon, carbones, escobilla, carbon motor, escobilla alternador
Partes Electricas;Sirenas;sirena, alarma, alarm, sirena alarma, bocina alarma
Partes Electricas;Mando Eleva Vidrio;mando eleva vidrio, switch levanta vidrios, comando vidrios, boton vidrios
Partes Electricas;Fusiblera;fusiblera, caja fusibles, fuse box, bloque fusibles, central fusibles
Partes Electricas;Resistencia Electroventilador;resistencia ventilador, modulo ventilador, reostato
Partes Electricas;Ramal de Luces;ramal luces, mazo luces, cableado luces, harness faros
Partes Electricas;Bateria Automotriz;bateria, battery, acumulador, duncan, bateria carro, bateria auto
Partes Electricas;Bobinas de Encendido;bobina, bobinas, coil, ignition coil, chupon bobina, bobina alta tension
Partes Electricas;Bombillos;bombillo, foco, bulb, led, halogeno, luz led
Partes Electricas;Bornes;borne, terminal bateria, borna, conector bateria
Partes Electricas;Boton y Interruptores;boton, interruptor, push button, switch, pulsador
Partes Electricas;Bujias y Torres;bujia, bujias, candela, spark plug, torre bujia, bujia encendido
Kit de Tiempos y Correas;Cadenas;cadena tiempo, timing chain, cadena distribucion, kit cadena
Kit de Tiempos y Correas;Tapa Correas;tapa correas, tapa cadena, cover timing, tapa distribucion
Kit de Tiempos y Correas;Correa de Distribucion;correa tiempo, correa distribucion, timing belt, banda tiempo
Kit de Tiempos y Correas;Correa Tipo V;correa v, correa poly v, correa acanalada, correa alternador
Kit de Tiempos y Correas;Correa Multicanal;correa multicanal, serpentine belt, correa accesorios
Kit de Tiempos y Correas;Kit de Cadena;kit cadena, kit timing chain, cadena completa
Kit de Tiempos y Correas;Kit de Correa;kit correa, kit timing belt, kit distribucion, kit tiempo
Kit de Tiempos y Correas;Patines;patin tensor, patin cadena, tensor guia, guide rail
Kit de Tiempos y Correas;Piones o Engranajes;pion, engranaje, gear, catalina, sprocket
Kit de Tiempos y Correas;Poleas;polea, pulley, polea tensora, polea loca, polea de accesorios
Kit de Tiempos y Correas;Racores;racor, racores, conector manguera, nipple, union
Kit de Tiempos y Correas;Tensores;tensor, tensioner, tensor correa, tensor cadena
Partes de Frenos;Bandas de Freno;banda freno, zapata freno, brake shoe, banda tambor
Partes de Frenos;Pastillas de Freno;pastillas, pastillas freno, balatas, brake pads, set pastillas
Partes de Frenos;Pistones de Caliper;piston caliper, cilindro caliper, piston freno
Partes de Frenos;Puntas de Eje;punta eje, punta tripoide, outer CV, terminal de eje
Partes de Frenos;Tambores de Freno;tambor freno, brake drum, campana freno
Partes de Frenos;Mordaza;mordaza, caliper, calibrador, caliper freno, pinza freno
Partes de Frenos;Goma Hidrovac;goma hidrovac, servo freno, booster, empaque hidrovac
Partes de Frenos;Accesorios de Frenos;accesorios freno, clips freno, resortes freno, guias freno
Partes de Frenos;Bombas de Freno;bomba freno, master cylinder, bomba de freno, cilindro maestro
Partes de Frenos;Cilindros de Freno;cilindro freno, wheel cylinder, bombin freno, cilindro rueda
Partes de Frenos;Copa Tapa Grasa;copa grasa, tapa grasa, dust cap, cubierta
Partes de Frenos;Discos de Freno;disco freno, brake rotor, discos freno, disco rayado, disco ventilado
Partes de Frenos;Kit de Bombas y Cilindros;kit bomba freno, kit cilindro freno, reparacion bomba
Partes de Frenos;Kit de Caliper;kit caliper, reparacion caliper, kit mordaza, sellos caliper
Partes de Frenos;Kit Punta de Eje;kit punta eje, kit tripoide, kit homocinetica
Partes de Frenos;Manguera de Freno;manguera freno, brake hose, latiguillo freno, manguera hidraulica
Partes de Motor;Anillos;anillos, aros, rings, aros piston, kit anillos
Partes de Motor;Carter de Motor;carter, oil pan, carter motor, bandeja aceite, tapa carter
Partes de Motor;Ciguenales;ciguenal, ciguenal, crankshaft, eje ciguenal, munon
Partes de Motor;Conchas de Bancada y Biela;concha biela, concha bancada, cojinete, bearing, metal biela, metal banco
Partes de Motor;Damper de Motor;damper, amortiguador vibraciones, harmonic balancer, polea amortiguadora
Partes de Motor;Envases de Refrigerante;envase refrigerante, deposito coolant, tanque expansion
Partes de Motor;Flautas;flauta, espaciador, separador valvula, coliza
Partes de Motor;Gomas de Valvulas;goma valvula, sello valvula, valve seal, reten valvula
Partes de Motor;Guias de Valvulas;guia valvula, valve guide, guia bronce
Partes de Motor;Martillos y Lochas;martillo locha, locha, balancin, rocker arm
Partes de Motor;Pistones y Semikit;piston, pistones, semikit, kit piston, embolo
Partes de Motor;Arbol de Levas;arbol leva, camshaft, leva, eje levas, leva motor
Partes de Motor;Radiadores y Componentes;radiador, radiator, radiador motor, tanque radiador
Partes de Motor;Sellos de Agua;sello agua, water seal, reten agua, estopera agua
Partes de Motor;Separador Axial de Ciguenal;separador axial, thrust washer, arandela empuje
Partes de Motor;Tapa Cadena o Correas;tapa cadena, tapa correas, timing cover, tapa distribucion
Partes de Motor;Tapas Radiador Aceite y Limpia;tapa radiador, tapa aceite, tapa limpia, tapa refrigerante
Partes de Motor;Tapas de Valvulas;tapa valvulas, valve cover, tapa de valvulas
Partes de Motor;Tapones de Carter;tapon carter, drain plug, tornillo aceite, tapa aceite
Partes de Motor;Taquetes;taquete, lifter, taquete hidraulico, empujador
Partes de Motor;Termostatos y Tomas de Agua;termostato, thermostat, toma de agua, housing termostato
Partes de Motor;Tornillos de Seguridad;tornillo seguridad, torx, allen, seguridad
Partes de Motor;Bases y Soportes de Motor;soporte motor, base motor, motor mount, soporte caja
Partes de Motor;Valvulas Admision y Escape;valvula, valvulas, valve, valvula admision, valvula escape
Partes de Motor;Varillas Medir Aceite;varilla aceite, dipstick, medidor aceite
Partes de Motor;Vastagos;vastago, vástago, stem, eje valvula
Partes de Motor;Separadores de Aceite;separador aceite, oil separator, pcv
Partes de Motor;Fan Clutch;fan clutch, embrague ventilador, clutch fan, embrague fan
Partes de Motor;Sellos de Motor;sello motor, oil seal, reten, estopera
Partes de Motor;Aspas de Ventilador;aspa ventilador, fan blade, aspa, ventilador mecanico
Partes de Motor;Kit Reparacion de Motor;kit reparacion motor, rebuild kit, kit motor
Partes de Motor;Enfriadores Bomba Aceite;enfriador aceite, oil cooler, radiador aceite
Partes de Motor;Bielas;biela, bielas, connecting rod
Partes de Motor;Porta Levas;porta leva, cam holder, soporte leva, tapa leva
Partes de Motor;Cuerpo de Aceleracion;cuerpo aceleracion, throttle body, mariposa, cuerpo acelerador
Partes de Motor;Tanque de Radiador;tanque radiador, deposito radiador, coolant tank
Partes de Motor;Baston Tubo de Agua;baston, tubo agua, pipe, conducto agua
Partes de Motor;Bombas de Aceite;bomba aceite, oil pump, bomba de aceite
Partes de Motor;Bombas de Agua;bomba agua, water pump, bomba de agua
Partes de Motor;Camaras de Compresion;camara compresion, combustion chamber, precamara
Partes de Motor;Capsula Pcv;capsula pcv, valvula pcv, breather
Partes de Motor;Carburadores y Componentes;carburador, carburetor, carburador motor
Rodamientos;Copa Cajas;copa caja, thrust bearing, arandela empuje
Rodamientos;Tricetas;triceta, tripie, araña cardan
Rodamientos;Puntas de Eje;punta eje, punta tripoide, punta cardan, stub axle
Rodamientos;Rodamiento Transmision;rodamiento caja, transmission bearing, kit rodamientos
Rodamientos;Crucetas;cruceta, universal joint, u-joint, cross
Rodamientos;Mazos o Cubos;mazo, cubo, hub, buje rueda
Rodamientos;Puentes de Cardan;puente cardan, center bearing, soporte cardan
Rodamientos;Puntas para Tripoides;punta tripoide, tip cv joint
Rodamientos;Rodamiento Alternador y Arranque;rodamiento alternador, rodamiento arranque, bearing
Rodamientos;Rodamiento Base Amortiguador;rodamiento base amortiguador, strut mount bearing, soporte
Rodamientos;Rodamiento para Cajas;rodamiento caja, gear bearing
Rodamientos;Rodamiento para Ruedas;rodamiento rueda, wheel bearing, ruleman, balinera
Suspension y Componentes;Amortiguadores Delanteros;amortiguador delantero, shock delantero
Suspension y Componentes;Terminales;terminal, tie rod end, terminal direccion, rotula terminal
Suspension y Componentes;Barra de Direccion;barra direccion, tie rod, barra acoplamiento, link
Suspension y Componentes;Espiral;espiral, resorte, spring, resorte suspension
Suspension y Componentes;Brazos Anclaje;brazo anclaje, trailing arm, brazo arrastre
Suspension y Componentes;Amortiguadores de Direccion;amortiguador direccion, steering damper
Suspension y Componentes;Barras y Brazos Tensores;barra tensor, tension bar, brazo tensor
Suspension y Componentes;Amortiguadores Traseros;amortiguador trasero, shock trasero
Suspension y Componentes;Bases de Amortiguador;base amortiguador, strut mount, soporte amortiguador
Suspension y Componentes;Bujes;buje, bushing, goma, buje suspension
Suspension y Componentes;Gemelos y Barras Estabilizadoras;gemelo, link estabilizador, sway bar link, barra estabilizadora
Suspension y Componentes;Mesetas;meseta, control arm, brazo suspension, horquilla
Suspension y Componentes;Munones;munon, knuckle, spindle, maza
Suspension y Componentes;Rotulas;rotula, ball joint, pivote
Suspension y Componentes;Brazos Pitman;brazo pitman, pitman arm, brazo direccion
Cajas y Componentes;Bomba de Embrague;bomba embrague, clutch master, master cilindro, bombin embrague
Cajas y Componentes;Guia Collarin;guia collarín, pilot bearing, guia embrague
Cajas y Componentes;Prensas y Discos;disco embrague, prensa embrague, clutch disc, pressure plate
Cajas y Componentes;Collarines;collarin, release bearing, clutch bearing
Cajas y Componentes;Kit de Embrague;kit embrague, clutch kit, kit croche, kit embrague completo
Cajas y Componentes;Kit de Palanca;kit palanca, shifter kit, kit cambios
Cajas y Componentes;Kit de Varillaje;kit varillaje, kit selector, linkage kit
Cajas y Componentes;Soportes de Caja;soporte caja, transmission mount, base caja
Cajas y Componentes;Aro Sincronizador;aro sincronizador, synchronizer ring, bloqueador
Cajas y Componentes;Filtros de Caja;filtro caja, transmission filter, filtro aceite caja
Cajas y Componentes;Kit de Satellite y Planetario;kit satelite, kit planetario, differential kit
Cajas y Componentes;Kit de Bombin;kit bombin, clutch slave kit, kit esclavo
Filtros y Purificadores;Filtros de Aceite;filtro aceite, oil filter, filtro de aceite
Filtros y Purificadores;Filtros de Aire y Cabina;filtro aire, air filter, filtro cabina, cabin filter, filtro polen
Filtros y Purificadores;Filtro Separador de Agua;filtro agua, fuel filter water separator
Filtros y Purificadores;Filtros Inyectores;filtro inyector, fuel filter injector, filtro de combustible
Filtros y Purificadores;Filtros para Bombas de Combustible;filtro bomba gasolina, fuel pump filter, malla filtro
Filtros y Purificadores;Filtros para Combustible;filtro combustible, fuel filter, filtro gasolina
Filtros y Purificadores;Purificadores;purificador, fuel purifier, separador
Direccion y Componentes;Bombas Hidraulicas;bomba direccion, power steering pump, bomba hidraulica
Direccion y Componentes;Envases de Direccion;envase direccion, power steering reservoir, deposito direccion
Direccion y Componentes;Kit Bomba Hidraulica;kit bomba direccion, repair kit power steering
Direccion y Componentes;Kit de Cajetines o Sector;kit cajetin, sector kit, steering box kit
Direccion y Componentes;Kit de Coupling;kit coupling, joint kit, acople direccion
Direccion y Componentes;Sectores;sector, steering sector, cajetin direccion
Direccion y Componentes;Coupling;coupling, acople, junta direccion, flexible
Estoperas;Estopera de Caja;estopera caja, oil seal transmission, reten caja
Estoperas;Estopera Tapa Cadena;estopera tapa cadena, seal timing cover
Estoperas;Estopera de Ruedas;estopera rueda, wheel seal, reten rueda
Estoperas;Estopera para Direccion;estopera direccion, steering seal, reten direccion
Estoperas;Estopera Ciguenal Trasera;estopera ciguenal trasera, rear main seal, reten trasero
Estoperas;Estopera para Transmisiones;estopera transmision, transmission seal
Estoperas;Estopera Sello de Bujia;estopera bujia, spark plug tube seal, reten bujia
Estoperas;Estopera para Cuello;estopera cuello, neck seal, reten cuello
Estoperas;Estopera Arbol de Leva;estopera arbol leva, cam seal, reten leva
Estoperas;Estopera Ciguenal Delantera;estopera ciguenal delantera, front main seal, reten delantero
Empacaduras;Empacadura Bajante;empaque bajante, downpipe gasket, junta escape
Empacaduras;Empacadura Tapa Cadena;empaque tapa cadena, timing cover gasket
Empacaduras;Empacadura Tapa Valvulas;empaque tapa valvulas, valve cover gasket
Empacaduras;Otras Empacaduras;empaque, gasket, junta, empacadura
Empacaduras;Kit de Empacaduras;kit empaques, gasket kit, juego empaques
Empacaduras;Juego de Empacadura Superior Inferior;empaque superior, empaque inferior, top gasket, bottom gasket
Empacaduras;Empacadura Cuerpo de Aceleracion;empaque cuerpo aceleracion, throttle body gasket
Empacaduras;Empacadura de Camara;empaque camara, chamber gasket
Empacaduras;Empacaduras Completas;empaque completo, full gasket set, rebuild gasket
Empacaduras;Empacadura Cuerpo de Valvula;empaque cuerpo valvula, valve body gasket
Empacaduras;Empacadura Multiple de Admision;empaque admision, intake manifold gasket
Empacaduras;Empacadura Multiple de Escape;empaque escape, exhaust manifold gasket
Empacaduras;Empacadura Bomba de Caja;empaque bomba caja, pump gasket
Empacaduras;Empacadura Carter de Caja;empaque carter caja, transmission pan gasket
Empacaduras;Empacadura Carter de Motor;empaque carter motor, oil pan gasket
Lubricantes y Aditivos;Aceite para Fuera de Borda;aceite fuera de borda, outboard oil, aceite motor marino
Lubricantes y Aditivos;Lubricante para Frenos;lubricante frenos, brake lubricant, grasa frenos
Lubricantes y Aditivos;Pinturas;pintura, pintura automotriz, aerosol, pintura en spray
Lubricantes y Aditivos;Pegamentos;pegamento, adhesivo, silicone, sellador
Lubricantes y Aditivos;Ducha Grafitada;ducha grafitada, grafito, lubricante seco
Lubricantes y Aditivos;Refrigerante;refrigerante, coolant, anticongelante
Lubricantes y Aditivos;Lubricante Multiuso;lubricante multiuso, aceite multiuso, wd40
Lubricantes y Aditivos;Aceite para Motocicletas;aceite moto, motorcycle oil, 2t, 4t
Lubricantes y Aditivos;Aceite para Motor;aceite motor, engine oil, 5w30, 10w40, 20w50, sintetico
Lubricantes y Aditivos;Aceite para Motor Diesel;aceite diesel, diesel oil, aceite turbo
Lubricantes y Aditivos;Aceite para Transmisiones;aceite caja, ATF, gear oil, aceite transmision
Lubricantes y Aditivos;Aditivos;aditivo, additive, limpiador inyectores, mejorador
Lubricantes y Aditivos;Desengrasantes;desengrasante, degreaser, limpiador motor
Lubricantes y Aditivos;Limpiadores;limpiador, cleaner, limpiador frenos, throttle cleaner
Lubricantes y Aditivos;Grasas;grasa, grease, grasa litio, grasa multiple
Seguridad Automotriz;Cinturon de Seguridad;cinturon, seatbelt, cinturon seguridad
Seguridad Automotriz;Tuercas para Rin;tuercas rin, lug nut, tuercas rueda
Seguridad Automotriz;Slinguer;slinguer, linga, eslinga, correa amarre
Seguridad Automotriz;Cinturon de Remolque;cinturon remolque, tow strap, correa remolque
Seguridad Automotriz;Triangulo de Seguridad;triangulo, warning triangle, señalizacion
Seguridad Automotriz;Bola de Remolque;bola remolque, tow ball, hitch ball
Seguridad Automotriz;Cables Auxiliar;cable auxiliar, jumper cables, cables puente, pinzas
Seguridad Automotriz;Casco de Seguridad;casco, helmet, casco moto
Seguridad Automotriz;Cerraduras de Seguridad;cerradura seguridad, lock, seguro antirrobo
Seguridad Automotriz;Extintor de Fuego;extintor, fire extinguisher, matafuego
Seguridad Automotriz;Gancho para Amarre;gancho amarre, tow hook, argolla remolque
Accesorios;Alfombras;alfombra, floor mat, tapete, bandeja carro
Accesorios;Difusores de Aire;difusor aire, air vent, rejilla ventilacion
Accesorios;Antenas;antena, antenna, antena techo, antena corta
Accesorios;Tapasol;tapasol, sun visor, parasol
Accesorios;Bolsos;bolso, carriola, organizador, bolso portaequipaje
Accesorios;Marco para Bateria;marco bateria, battery tray, soporte bateria
Accesorios;Sujetadores para Parachoques;sujetador parachoques, bumper clip, clip
Accesorios;Emblemas;emblema, emblema, logo, letras, calcomania
Accesorios;Letreros;letrero, sticker, nombre, vinil
Accesorios;Cinturon de Remolque;cinturon remolque, tow strap, correa tiro
Accesorios;Tornillos Tunning;tornillo tunning, tuning screw, tornillo estetico
Accesorios;Encendedor de Cigarillo;encendedor, car lighter, 12v, toma corriente
Accesorios;Tapa Caliper Tunning;tapa caliper, caliper cover, cubierta caliper
Accesorios;Pomos y Perillas;perilla, pomo, knob, mango palanca
Accesorios;Espejo Punto Ciego;espejo punto ciego, blind spot mirror, retrovisorito
Accesorios;Tapas Decorativas;tapa decorativa, hubcap, copa rin
Accesorios;Forros para Volante y Palanca;forro volante, steering wheel cover, forro palanca
Accesorios;Reloj y Componentes;reloj, clock, reloj carro
Accesorios;Tapa Valvula de Caucho;tapa valvula, valve cap, capuchon
Accesorios;Porta Placas;porta placa, license plate frame, marco placa
Accesorios;Alarmas y Sistema de Bloqueo;alarma, alarm, sistema antirrobo, bloqueo
Accesorios;Llaveros;llavero, keychain, llavero carro
Accesorios;Ventilador;ventilador, fan, ventilador interno
Accesorios;Camaras de Video;camara, backup camera, camara reversa
Accesorios;Reproductores;reproductor, radio, estereo, multimedia, car audio
Accesorios;Ambientadores;ambientador, air freshener, aromatizante
Mangueras;Mangueras Hidraulicas;manguera hidraulica, hydraulic hose, manguera direccion
Mangueras;Mangueras para Combustible;manguera combustible, fuel hose, manguera gasolina
Mangueras;Mangueras para Flujo de Aire;manguera aire, air hose, manguera vacio
Mangueras;Mangueras para Radiador;manguera radiador, radiator hose, manguera agua
Mangueras;Mangueras de Gases;manguera gases, manguera escape, silicone hose
Mangueras;Manguera para Envase Refrigerante;manguera refrigerante, coolant hose
Mangueras;Mangueras Termostato;manguera termostato, thermostat hose
Mangueras;Mangueras de Calefaccion;manguera calefaccion, heater hose
Mangueras;Manguera Paso;manguera paso, bypass hose
Gomas y Guardapolvos;Goma Barra Estabilizadora;goma barra, sway bar bushing, buje estabilizadora
Gomas y Guardapolvos;Goma para Puente;goma puente, center bearing rubber, soporte
Gomas y Guardapolvos;Caucho para Bicicleta;caucho bici, tire, cubierta
Gomas y Guardapolvos;Gomas de Cajetin;goma cajetin, steering gear bushing
Gomas y Guardapolvos;Gomas para Espirales y Amortiguadores;goma espiral, spring isolator, top
Gomas y Guardapolvos;Guarda Polvo Amortiguador;guardapolvo amortiguador, dust cover, fuelle
Gomas y Guardapolvos;Guarda Polvo de Cajetin;guardapolvo cajetin, boot rack
Gomas y Guardapolvos;Guarda Polvo para Tripoides;guardapolvo tripoide, cv boot, fuelle
Gomas y Guardapolvos;Guarda Polvo Terminal;guardapolvo terminal, tie rod boot
Gomas y Guardapolvos;Oring Sello;oring, o-ring, reten, sello
Gomas y Guardapolvos;Goma Barra Tensora;goma barra tensora, tension bar bushing
Gomas y Guardapolvos;Tapones de Agua;tapon agua, water plug, tapon culata
Carroceria;Capot;capo, capot, hood, cofre, tapa motor
Carroceria;Copas de Rin;copa rin, hubcap, tapa rueda
Carroceria;Porta Equipaje;porta equipaje, roof rack, baca, parrilla techo
Carroceria;Brazo Limpiaparabrisas;brazo limpia, wiper arm, brazo plumilla
Carroceria;Clips para Tapiceria;clip tapiceria, upholstery clip, goma
Carroceria;Mecanismo Electrico;mecanismo electrico, window regulator, levanta vidrios
Carroceria;Cepillo Limpiaparabrisas;cepillo limpia, wiper blade, plumilla
Carroceria;Tapa Gasolina;tapa gasolina, fuel cap, tapa tanque
Carroceria;Palanca de Cambios;palanca cambios, gear stick, shifter
Carroceria;Envase Limpiaparabrisas;envase limpia, washer bottle, deposito agua
Carroceria;Puertas;puerta, door, puerta lateral
Carroceria;Guardabarros;guardabarros, fender, aleta
Carroceria;Rejillas;rejilla, grille, parrilla
Carroceria;Retrovisores y Componentes;retrovisor, espejo, mirror, espejo lateral
Carroceria;Camisa;camisa, cylinder liner, camisa cilindro
Carroceria;Amortiguador de Compuerta;amortiguador compuerta, tailgate strut, gas lift
Carroceria;Clindro de Puerta y Maleta;cilindro puerta, door lock cylinder, chapa
Carroceria;Manillas;manilla, manija, handle, manilla puerta
Guayas;Guaya Capot;guaya capot, hood release cable
Guayas;Guaya de Acelerador;guaya acelerador, throttle cable
Guayas;Guaya de Embrague;guaya embrague, clutch cable
Guayas;Guaya Kilometraje;guaya kilometro, speedometer cable
Guayas;Guaya Selectora;guaya selectora, shift cable, guaya cambios
Guayas;Guayas para Frenos;guaya freno, brake cable, guaya freno mano
Guayas;Guaya Compuerta;guaya compuerta, trunk release cable, guaya maleta
Guayas;Guaya de Velocimetro;guaya velocimetro, speedo cable
Faros y Micas;Faros Cabinas;faro cabina, cab light, luz cabina
Faros y Micas;Faros Delanteros;faro delantero, headlight, foco delantero
Faros y Micas;Faros Laterales;faro lateral, side light, luz lateral
Faros y Micas;Faros Traseros;faro trasero, taillight, stop, calavera
Faros y Micas;Micas Delanteras;mica delantera, lens headlight
Faros y Micas;Micas Laterales;mica lateral, side lens
Faros y Micas;Micas Traseras;mica trasera, tail light lens
Faros y Micas;Faros Direccionales;faro direccional, blinkers, luz direccional, pidevia
Faros y Micas;Faros Antiniebla;faros antiniebla, fog light, neblinero
Inyeccion y Combustion;Bombas de Combustible;bomba gasolina, fuel pump, pila gasolina
Inyeccion y Combustion;Flotadores;flotador, fuel sender, boya, sensor gasolina
Inyeccion y Combustion;Inyectores;inyector, injector, fuel injector
Inyeccion y Combustion;Mangueras Combustible;manguera combustible, fuel hose
Inyeccion y Combustion;Modulos de Combustible;modulo combustible, fuel module, bomba completa
Inyeccion y Combustion;Regulador de Combustible;regulador combustible, fuel regulator, presion gasolina
Inyeccion y Combustion;Tapas para Modulo de Combustible;tapa modulo, fuel module cap, tapa bomba`;
function parseCsv() {
    return CSV_RAW.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
        const parts = line.split(';');
        return {
            category: parts[0]?.trim() ?? '',
            subcategory: parts[1]?.trim() ?? '',
            keywords: (parts[2] ?? '').split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0),
        };
    })
        .filter(r => r.category && r.subcategory);
}
const SUBCATEGORY_MAP = {
    'Motor|Pistones': { newCat: 'Partes de Motor', newSub: 'Pistones y Semikit' },
    'Motor|Bielas': { newCat: 'Partes de Motor', newSub: 'Bielas' },
    'Motor|Cigüeñal': { newCat: 'Partes de Motor', newSub: 'Ciguenales' },
    'Motor|Válvulas': { newCat: 'Partes de Motor', newSub: 'Valvulas Admision y Escape' },
    'Motor|Bujías': { newCat: 'Partes Electricas', newSub: 'Bujias y Torres' },
    'Motor|Empaques': { newCat: 'Empacaduras', newSub: 'Kit de Empacaduras' },
    'Transmisión|Caja de cambios': { newCat: 'Cajas y Componentes', newSub: 'Aro Sincronizador' },
    'Transmisión|Embrague': { newCat: 'Cajas y Componentes', newSub: 'Kit de Embrague' },
    'Transmisión|Cardán': { newCat: 'Rodamientos', newSub: 'Crucetas' },
    'Transmisión|Diferencial': { newCat: 'Cajas y Componentes', newSub: 'Kit de Satellite y Planetario' },
    'Suspensión|Amortiguadores': { newCat: 'Suspension y Componentes', newSub: 'Amortiguadores Delanteros' },
    'Suspensión|Resortes': { newCat: 'Suspension y Componentes', newSub: 'Espiral' },
    'Suspensión|Rótulas': { newCat: 'Suspension y Componentes', newSub: 'Rotulas' },
    'Suspensión|Bujes': { newCat: 'Suspension y Componentes', newSub: 'Bujes' },
    'Suspensión|Barras': { newCat: 'Suspension y Componentes', newSub: 'Barras y Brazos Tensores' },
    'Frenos|Pastillas': { newCat: 'Partes de Frenos', newSub: 'Pastillas de Freno' },
    'Frenos|Discos': { newCat: 'Partes de Frenos', newSub: 'Discos de Freno' },
    'Frenos|Tambores': { newCat: 'Partes de Frenos', newSub: 'Tambores de Freno' },
    'Frenos|Líquido de frenos': { newCat: 'Lubricantes y Aditivos', newSub: 'Lubricante para Frenos' },
    'Frenos|Calibradores': { newCat: 'Partes de Frenos', newSub: 'Mordaza' },
    'Eléctrico|Motor de arranque': { newCat: 'Partes Electricas', newSub: 'Arranques y Componentes' },
    'Eléctrico|Batería': { newCat: 'Partes Electricas', newSub: 'Bateria Automotriz' },
    'Eléctrico|Bobinas': { newCat: 'Partes Electricas', newSub: 'Bobinas de Encendido' },
    'Eléctrico|Sensores': { newCat: 'Partes Electricas', newSub: 'Sensores' },
    'Eléctrico|Alternador': { newCat: 'Partes Electricas', newSub: 'Alternadores y Componentes' },
    'Iluminación|Faros': { newCat: 'Faros y Micas', newSub: 'Faros Delanteros' },
    'Iluminación|Stops': { newCat: 'Faros y Micas', newSub: 'Faros Traseros' },
    'Iluminación|Bombillos': { newCat: 'Partes Electricas', newSub: 'Bombillos' },
    'Iluminación|Exploradoras': { newCat: 'Faros y Micas', newSub: 'Faros Antiniebla' },
    'Carrocería|Parachoques': { newCat: 'Accesorios', newSub: 'Sujetadores para Parachoques' },
    'Carrocería|Guardafangos': { newCat: 'Carroceria', newSub: 'Guardabarros' },
    'Carrocería|Capó': { newCat: 'Carroceria', newSub: 'Capot' },
    'Carrocería|Puertas': { newCat: 'Carroceria', newSub: 'Puertas' },
    'Carrocería|Espejos': { newCat: 'Carroceria', newSub: 'Retrovisores y Componentes' },
    'Filtros|Filtro de aceite': { newCat: 'Filtros y Purificadores', newSub: 'Filtros de Aceite' },
    'Filtros|Filtro de aire': { newCat: 'Filtros y Purificadores', newSub: 'Filtros de Aire y Cabina' },
    'Filtros|Filtro de combustible': { newCat: 'Filtros y Purificadores', newSub: 'Filtros para Combustible' },
    'Filtros|Filtro de cabina': { newCat: 'Filtros y Purificadores', newSub: 'Filtros de Aire y Cabina' },
    'Interior|Alfombras': { newCat: 'Accesorios', newSub: 'Alfombras' },
    'Interior|Manillas': { newCat: 'Carroceria', newSub: 'Manillas' },
    'Interior|Tapicería': { newCat: 'Accesorios', newSub: 'Forros para Volante y Palanca' },
    'Interior|Tablero': { newCat: 'Accesorios', newSub: 'Difusores de Aire' },
    'Neumáticos|Cauchos': { newCat: 'Gomas y Guardapolvos', newSub: 'Caucho para Bicicleta' },
    'Neumáticos|Rines': { newCat: 'Accesorios', newSub: 'Tapas Decorativas' },
    'Neumáticos|Válvulas de aire': { newCat: 'Accesorios', newSub: 'Tapa Valvula de Caucho' },
};
async function migrate() {
    const csvRows = parseCsv();
    console.log(`Parsed ${csvRows.length} CSV rows`);
    const csvCategoryNames = [...new Set(csvRows.map(r => r.category))];
    console.log(`\n=== Step 1: Creating ${csvCategoryNames.length} categories ===`);
    const categoryMap = {};
    for (const catName of csvCategoryNames) {
        const existing = await prisma.partCategory.findFirst({ where: { name: catName } });
        if (existing) {
            categoryMap[catName] = existing.id;
            console.log(`  Category "${catName}" already exists (${existing.id})`);
        }
        else {
            const created = await prisma.partCategory.create({
                data: { name: catName, displayOrder: csvCategoryNames.indexOf(catName) + 1 },
            });
            categoryMap[catName] = created.id;
            console.log(`  Created category "${catName}" (${created.id})`);
        }
    }
    console.log(`\n=== Step 2: Creating subcategories from CSV ===`);
    const subcategoryMap = {};
    let subsCreated = 0;
    let subsExisted = 0;
    for (const row of csvRows) {
        const catId = categoryMap[row.category];
        if (!catId) {
            console.error(`  Missing category for: ${row.category}`);
            continue;
        }
        const key = `${row.category}|${row.subcategory}`;
        const existing = await prisma.partSubcategory.findFirst({
            where: { categoryId: catId, name: row.subcategory },
        });
        if (existing) {
            subcategoryMap[key] = existing.id;
            subsExisted++;
        }
        else {
            const created = await prisma.partSubcategory.create({
                data: { name: row.subcategory, categoryId: catId },
            });
            subcategoryMap[key] = created.id;
            subsCreated++;
        }
    }
    console.log(`  Created: ${subsCreated}, Already existed: ${subsExisted}`);
    console.log(`\n=== Step 3: Reassigning old subcategories ===`);
    const oldSubs = await prisma.partSubcategory.findMany({
        include: {
            category: { select: { name: true } },
            _count: { select: { requests: true, vendorPartSubcategories: true } },
        },
    });
    for (const oldSub of oldSubs) {
        const mapKey = `${oldSub.category.name}|${oldSub.name}`;
        const mapping = SUBCATEGORY_MAP[mapKey];
        if (!mapping)
            continue;
        const targetKey = `${mapping.newCat}|${mapping.newSub}`;
        const targetSubId = subcategoryMap[targetKey];
        if (!targetSubId) {
            console.error(`  Target not found for ${mapKey} → ${targetKey}`);
            continue;
        }
        if (targetSubId === oldSub.id)
            continue;
        const hasData = oldSub._count.requests > 0 || oldSub._count.vendorPartSubcategories > 0;
        if (hasData) {
            const reqUpdated = await prisma.request.updateMany({
                where: { partSubcategoryId: oldSub.id },
                data: { partSubcategoryId: targetSubId, partCategoryId: categoryMap[mapping.newCat] },
            });
            const vendorAssocs = await prisma.vendorPartSubcategory.findMany({
                where: { partSubcategoryId: oldSub.id },
            });
            for (const va of vendorAssocs) {
                const exists = await prisma.vendorPartSubcategory.findFirst({
                    where: { vendorId: va.vendorId, partSubcategoryId: targetSubId },
                });
                if (!exists) {
                    await prisma.vendorPartSubcategory.create({
                        data: { vendorId: va.vendorId, partSubcategoryId: targetSubId },
                    });
                }
                await prisma.vendorPartSubcategory.delete({ where: { id: va.id } });
            }
            console.log(`  Migrated "${mapKey}" → "${targetKey}" (${reqUpdated.count} requests, ${vendorAssocs.length} vendors)`);
        }
        await prisma.request.updateMany({
            where: { partCategoryId: oldSub.categoryId, partSubcategoryId: oldSub.id },
            data: { partCategoryId: categoryMap[mapping.newCat], partSubcategoryId: targetSubId },
        });
    }
    console.log(`\n=== Step 4: Fix remaining request category references ===`);
    const CATEGORY_RENAME_MAP = {
        'Motor': 'Partes de Motor',
        'Transmisión': 'Cajas y Componentes',
        'Suspensión': 'Suspension y Componentes',
        'Frenos': 'Partes de Frenos',
        'Iluminación': 'Faros y Micas',
        'Eléctrico': 'Partes Electricas',
        'Carrocería': 'Carroceria',
        'Filtros': 'Filtros y Purificadores',
    };
    for (const [oldName, newName] of Object.entries(CATEGORY_RENAME_MAP)) {
        const oldCat = await prisma.partCategory.findFirst({ where: { name: oldName } });
        const newCatId = categoryMap[newName];
        if (oldCat && newCatId && oldCat.id !== newCatId) {
            const updated = await prisma.request.updateMany({
                where: { partCategoryId: oldCat.id },
                data: { partCategoryId: newCatId },
            });
            if (updated.count > 0) {
                console.log(`  Moved ${updated.count} requests from "${oldName}" to "${newName}"`);
            }
        }
    }
    console.log(`\n=== Step 5: Import keywords ===`);
    const deletedKws = await prisma.partKeyword.deleteMany({});
    console.log(`  Deleted ${deletedKws.count} old keywords`);
    let kwsCreated = 0;
    for (const row of csvRows) {
        const key = `${row.category}|${row.subcategory}`;
        const subId = subcategoryMap[key];
        if (!subId)
            continue;
        for (const kw of row.keywords) {
            await prisma.partKeyword.create({
                data: { subcategoryId: subId, keyword: kw },
            });
            kwsCreated++;
        }
    }
    console.log(`  Created ${kwsCreated} new keywords`);
    console.log(`\n=== Step 6: Cleanup old subcategories ===`);
    const allOldSubs = await prisma.partSubcategory.findMany({
        include: {
            category: { select: { name: true } },
            _count: { select: { requests: true, vendorPartSubcategories: true, keywords: true } },
        },
    });
    const csvSubKeys = new Set(csvRows.map(r => `${r.category}|${r.subcategory}`));
    for (const sub of allOldSubs) {
        const key = `${sub.category.name}|${sub.name}`;
        if (csvSubKeys.has(key))
            continue;
        if (sub._count.requests > 0 || sub._count.vendorPartSubcategories > 0) {
            console.log(`  SKIPPED "${key}" (has ${sub._count.requests} requests, ${sub._count.vendorPartSubcategories} vendors)`);
            continue;
        }
        await prisma.partKeyword.deleteMany({ where: { subcategoryId: sub.id } });
        await prisma.partSubcategory.delete({ where: { id: sub.id } });
        console.log(`  Deleted orphan subcategory: "${key}"`);
    }
    console.log(`\n=== Step 7: Cleanup old categories ===`);
    const toDelete = ['Interior', 'Neumáticos', 'Partes Eléctricas', 'Motor', 'Transmisión',
        'Suspensión', 'Frenos', 'Iluminación', 'Eléctrico', 'Carrocería', 'Filtros'];
    for (const catName of toDelete) {
        const cat = await prisma.partCategory.findFirst({ where: { name: catName } });
        if (!cat)
            continue;
        const subCount = await prisma.partSubcategory.count({ where: { categoryId: cat.id } });
        const reqCount = await prisma.request.count({ where: { partCategoryId: cat.id } });
        if (subCount > 0 || reqCount > 0) {
            console.log(`  SKIPPED category "${catName}" (${subCount} subs, ${reqCount} requests remaining)`);
            continue;
        }
        await prisma.partCategory.delete({ where: { id: cat.id } });
        console.log(`  Deleted category: "${catName}"`);
    }
    const finalCats = await prisma.partCategory.count();
    const finalSubs = await prisma.partSubcategory.count();
    const finalKws = await prisma.partKeyword.count();
    console.log(`\n=== MIGRATION COMPLETE ===`);
    console.log(`Categories: ${finalCats} | Subcategories: ${finalSubs} | Keywords: ${finalKws}`);
}
migrate()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
    console.error('Migration failed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-categories.js.map