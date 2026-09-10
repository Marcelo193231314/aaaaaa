import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { Residente, Visita } from './Modelos.js';
import { Edificio } from './Edificio.js';
import { GestorResidentes } from './GestorResidentes.js';
import { GestorVisitas } from './GestorVisitas.js';

// 1. Inicializar Sistema
const miEdificio = new Edificio();
const controlResidentes = new GestorResidentes(miEdificio);
const controlVisitas = new GestorVisitas(miEdificio);

// 2. Configurar la interfaz de consola
const rl = readline.createInterface({ input, output });

async function iniciarSistema() {
    let salir = false;

    while (!salir) {
        console.log("\n========================================");
        console.log("   SISTEMA DE ADMINISTRACIÓN DE ACCESOS");
        console.log("========================================");
        console.log("1. Dar de alta a un residente");
        console.log("2. Modificar datos de un residente");
        console.log("3. Dar de baja a un residente");
        console.log("4. Registrar una visita");
        console.log("5. Modificar una visita");
        console.log("6. Salir del sistema");
        console.log("========================================");
        
        const opcion = await rl.question("Elige una opción (1-6): ");

        try {
            switch (opcion) {
                case '1':
                    console.log("\n--- ALTA DE RESIDENTE ---");
                    const deptoAlta = parseInt(await rl.question("Número de departamento (ej. 101, 504): "));
                    const idRes = await rl.question("Crea un ID para el residente (ej. R-01): ");
                    const nombreRes = await rl.question("Nombre completo: ");
                    const telRes = await rl.question("Teléfono: ");
                    
                    const nuevoResidente = new Residente(idRes, nombreRes, telRes);
                    console.log("\n>>", controlResidentes.altaResidente(deptoAlta, nuevoResidente));
                    break;

                case '2':
                    console.log("\n--- MODIFICAR RESIDENTE ---");
                    const deptoMod = parseInt(await rl.question("Número de departamento: "));
                    const idMod = await rl.question("ID del residente a modificar: ");
                    const nuevoTel = await rl.question("Ingresa el nuevo teléfono: ");
                    
                    console.log("\n>>", controlResidentes.modificarResidente(deptoMod, idMod, { telefono: nuevoTel }));
                    break;

                case '3':
                    console.log("\n--- BAJA DE RESIDENTE ---");
                    const deptoBaja = parseInt(await rl.question("Número de departamento: "));
                    const idBaja = await rl.question("ID del residente a dar de baja: ");
                    
                    console.log("\n>>", controlResidentes.bajaResidente(deptoBaja, idBaja));
                    break;

                case '4':
                    console.log("\n--- REGISTRAR VISITA ---");
                    const idVisita = await rl.question("Crea un ID para la visita (ej. V-01): ");
                    const nombreVisita = await rl.question("Nombre del visitante: ");
                    const deptoDestino = parseInt(await rl.question("Departamento que visita (ej. 204): "));
                    const tipoVisita = await rl.question("Tipo de visita (ej. Familiar, Paquetería, Servicio): ");
                    
                    const nuevaVisita = new Visita(idVisita, nombreVisita, deptoDestino, tipoVisita);
                    console.log("\n>>", controlVisitas.registrarVisita(nuevaVisita));
                    break;

                case '5':
                    console.log("\n--- MODIFICAR VISITA ---");
                    const idVisitaMod = await rl.question("ID de la visita a modificar: ");
                    const nuevoTipo = await rl.question("Nuevo tipo de visita o motivo: ");
                    
                    console.log("\n>>", controlVisitas.modificarVisita(idVisitaMod, { tipoVisita: nuevoTipo }));
                    break;

                case '6':
                    console.log("\nCerrando el sistema. ¡Hasta luego!");
                    salir = true;
                    rl.close();
                    break;

                default:
                    console.log("\n>> Opción no válida. Por favor, elige un número del 1 al 6.");
            }
        } catch (error) {
            console.log("\n>> ERROR:", error.message);
        }
    }
}

// Arrancar el programa
iniciarSistema();