// backend/test.js
import assert from 'assert';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';

const BASE_URL = 'http://localhost:3000/api';

// Utilidad para hacer las peticiones a nuestra propia API
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(BASE_URL + endpoint, options);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Error desconocido');
    return data;
}

console.log(`${BLUE}=====================================================${RESET}`);
console.log(`${BLUE}  EJECUTANDO PRUEBAS DE INTEGRACIÓN AL SERVIDOR API${RESET}`);
console.log(`${BLUE}=====================================================\n${RESET}`);

// Variables globales para guardar los IDs generados por el servidor
let idResidente = '';
let idVisitaPendiente = '';
let idInvitacion = '';
const DEPTO_PRUEBA = 101;
const DEPTO_VACIO = 504;

async function ejecutarPruebas() {
    try {
        // Primero verificamos que el servidor esté vivo
        await apiCall('/admin/datos');
    } catch (e) {
        console.log(`${RED}⚠️ ERROR CRÍTICO: El servidor no está corriendo. Enciende el servidor con 'node backend/server.js' en otra terminal antes de correr las pruebas.${RESET}`);
        return;
    }

    // ==========================================
    // 1. PRUEBAS DE RESIDENTES (API)
    // ==========================================
    console.log(`${YELLOW}--- TEST: API DE RESIDENTES ---${RESET}`);

    // ✔ PRUEBA EXITOSA: Alta de Residente
    try {
        await apiCall('/residentes', 'POST', { depto: DEPTO_PRUEBA, nombre: 'Carlos Martinez', telefono: '555-0000' });
        
        // Consultamos la BD para ver si se guardó y obtener su ID generado
        const datos = await apiCall('/admin/datos');
        const residente = datos.residentes.find(r => r.nombre === 'Carlos Martinez');
        assert.ok(residente, "El residente no se encontró en la base de datos");
        idResidente = residente.id; // Guardamos el ID para las siguientes pruebas
        
        console.log(`${GREEN}✔ [ÉXITO] POST /residentes: Alta exitosa. ID asignado por el servidor: ${idResidente}${RESET}`);
    } catch (error) { console.log(`${RED}✘ FALLO: ${error.message}${RESET}`); }

    // ✘ PRUEBA FALLIDA: Residente duplicado
    try {
        await apiCall('/residentes', 'POST', { depto: DEPTO_PRUEBA, nombre: 'Carlos Martinez', telefono: '555-1111' });
        console.log(`${RED}✘ [ERROR] La API permitió nombres duplicados.${RESET}`);
    } catch (error) {
        console.log(`${GREEN}✔ [FALLA CONTROLADA] POST /residentes: La API bloqueó el duplicado. Error: "${error.message}"${RESET}`);
    }

    // ✘ PRUEBA FALLIDA: Editar un ID falso
    try {
        await apiCall('/residentes/ID-FALSO-999', 'PUT', { nombre: 'Fake', telefono: '000' });
        console.log(`${RED}✘ [ERROR] La API permitió editar un ID inexistente.${RESET}`);
    } catch (error) {
        console.log(`${GREEN}✔ [FALLA CONTROLADA] PUT /residentes/:id : La API bloqueó editar un ID falso. Error: "${error.message}"${RESET}`);
    }


    // ==========================================
    // 2. PRUEBAS DE CASETA (VISITAS SORPRESA Y AUTORIZACIÓN)
    // ==========================================
    console.log(`\n${YELLOW}--- TEST: API DE CASETA Y AUTORIZACIONES ---${RESET}`);

    // ✘ PRUEBA FALLIDA: Visita a un departamento vacío
    try {
        await apiCall('/visitas/manual', 'POST', { nombre: 'Juan', depto: DEPTO_VACIO, tipo: 'Delivery' });
        console.log(`${RED}✘ [ERROR] La API permitió mandar visita a un departamento sin residentes.${RESET}`);
    } catch (error) {
        console.log(`${GREEN}✔ [FALLA CONTROLADA] POST /visitas/manual: La API bloqueó la visita a depto vacío. Error: "${error.message}"${RESET}`);
    }

    // ✔ PRUEBA EXITOSA: Registro manual (Visita Sorpresa)
    try {
        await apiCall('/visitas/manual', 'POST', { nombre: 'Repartidor Amazon', depto: DEPTO_PRUEBA, tipo: 'Delivery' });
        
        // Consultar pendientes para obtener el ID de la visita
        const pendientes = await apiCall('/caseta/pendientes');
        const visita = pendientes.find(v => v.nombre === 'Repartidor Amazon');
        assert.ok(visita, "La visita no se puso en la fila de espera");
        idVisitaPendiente = visita.id;

        console.log(`${GREEN}✔ [ÉXITO] POST /visitas/manual: Visita sorpresa retenida correctamente. ID: ${idVisitaPendiente}${RESET}`);
    } catch (error) { console.log(`${RED}✘ FALLO: ${error.message}${RESET}`); }

    // ✔ PRUEBA EXITOSA: Residente RECHAZA la visita
    try {
        await apiCall(`/visitas/rechazar/${idVisitaPendiente}`, 'PUT');
        const activas = await apiCall('/caseta/activas');
        assert.strictEqual(activas.find(v => v.id === idVisitaPendiente), undefined, "La visita entró a pesar del rechazo");
        console.log(`${GREEN}✔ [ÉXITO] PUT /visitas/rechazar/:id : Residente rechazó acceso. La visita NO entró.${RESET}`);
    } catch (error) { console.log(`${RED}✘ FALLO: ${error.message}${RESET}`); }

    // ✘ PRUEBA FALLIDA: Dar salida a quien nunca entró
    try {
        await apiCall(`/visitas/salida/${idVisitaPendiente}`, 'PUT');
        console.log(`${RED}✘ [ERROR] La API dio salida a alguien que fue rechazado.${RESET}`);
    } catch (error) {
        console.log(`${GREEN}✔ [FALLA CONTROLADA] PUT /visitas/salida/:id : La API impidió dar salida a visita inactiva. Error: "${error.message}"${RESET}`);
    }


    // ==========================================
    // 3. PRUEBAS DE INVITACIONES (CÓDIGOS QR)
    // ==========================================
    console.log(`\n${YELLOW}--- TEST: API DE INVITACIONES ---${RESET}`);

    // ✔ PRUEBA EXITOSA: Residente crea invitación y Guardia la aprueba
    try {
        // 1. Residente crea código
        const res = await apiCall('/invitaciones', 'POST', { nombre: 'Tio Beto', depto: DEPTO_PRUEBA, tipo: 'Familiar' });
        
        // Extraemos el código generado (el backend devuelve un texto que incluye el ID, ej: '...código: V-XXXX')
        idInvitacion = res.mensaje.split('código: ')[1];
        
        // 2. Caseta valida el código
        await apiCall('/visitas/validar', 'POST', { codigo: idInvitacion });
        
        // 3. Verificamos que esté adentro
        const activas = await apiCall('/caseta/activas');
        assert.ok(activas.find(v => v.id === idInvitacion), "El invitado no aparece en la tabla de activos");

        // 4. Salida
        await apiCall(`/visitas/salida/${idInvitacion}`, 'PUT');

        console.log(`${GREEN}✔ [ÉXITO] FLUJO COMPLETO INVITACIÓN: Código generado (${idInvitacion}), validado, y visitante salió del edificio.${RESET}`);
    } catch (error) { console.log(`${RED}✘ FALLO: ${error.message}${RESET}`); }

    // ✘ PRUEBA FALLIDA: Validar código que no existe
    try {
        await apiCall('/visitas/validar', 'POST', { codigo: 'CODIGO-INVENTADO' });
        console.log(`${RED}✘ [ERROR] La API abrió la barrera con un código falso.${RESET}`);
    } catch (error) {
        console.log(`${GREEN}✔ [FALLA CONTROLADA] POST /visitas/validar: La API bloqueó el código falso. Error: "${error.message}"${RESET}`);
    }


    // ==========================================
    // 4. LIMPIEZA FINAL (DELETE)
    // ==========================================
    console.log(`\n${YELLOW}--- TEST: LIMPIEZA DE BASE DE DATOS ---${RESET}`);

    // ✔ PRUEBA EXITOSA: Eliminar residente
    try {
        await apiCall(`/residentes/${idResidente}`, 'DELETE');
        
        const datos = await apiCall('/admin/datos');
        assert.strictEqual(datos.residentes.find(r => r.id === idResidente), undefined);
        console.log(`${GREEN}✔ [ÉXITO] DELETE /residentes/:id : Residente borrado limpiamente de la API.${RESET}`);
    } catch (error) { console.log(`${RED}✘ FALLO: ${error.message}${RESET}`); }


    console.log(`\n${BLUE}=====================================================${RESET}`);
    console.log(`${BLUE}       PRUEBAS DE API FINALIZADAS CON ÉXITO          ${RESET}`);
    console.log(`${BLUE}=====================================================${RESET}`);
}

// Iniciar los tests
ejecutarPruebas();