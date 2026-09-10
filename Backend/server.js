import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Residente, Visita } from './Modelos.js';
import { Edificio } from './Edificio.js';
import { GestorResidentes } from './GestorResidentes.js';
import { GestorVisitas } from './GestorVisitas.js';

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../frontend')));

const miEdificio = new Edificio();
const controlResidentes = new GestorResidentes(miEdificio);
const controlVisitas = new GestorVisitas(miEdificio);

// --- ADMINISTRACIÓN ---
app.get('/api/admin/datos', (req, res) => {
    res.json({ disponibles: miEdificio.obtenerTodosLosDepartamentos(), residentes: miEdificio.obtenerTodosLosResidentes() });
});
app.post('/api/residentes', (req, res) => {
    try {
        const { depto, nombre, telefono } = req.body;
        const id = 'R-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        res.json({ mensaje: controlResidentes.altaResidente(depto, new Residente(id, nombre, telefono)) });
    } catch (error) { res.status(400).json({ error: error.message }); }
});
app.put('/api/residentes/:id', (req, res) => {
    try { res.json({ mensaje: controlResidentes.modificarResidente(req.params.id, req.body) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});
app.delete('/api/residentes/:id', (req, res) => {
    try { res.json({ mensaje: controlResidentes.bajaResidente(req.params.id) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});

// --- CASETA ---
app.get('/api/caseta/activas', (req, res) => res.json(controlVisitas.obtenerVisitasActivas()));
app.get('/api/caseta/pendientes', (req, res) => res.json(controlVisitas.obtenerTodasLasPendientes()));

app.post('/api/visitas/validar', (req, res) => {
    try { res.json({ mensaje: controlVisitas.validarInvitacion(req.body.codigo) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});
app.post('/api/visitas/manual', (req, res) => {
    try {
        const idVis = 'V-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const nuevaVisita = new Visita(idVis, req.body.nombre, req.body.depto, req.body.tipo);
        res.json({ mensaje: controlVisitas.registrarWalkIn(nuevaVisita) });
    } catch (error) { res.status(400).json({ error: error.message }); }
});
app.put('/api/visitas/salida/:id', (req, res) => {
    try { res.json({ mensaje: controlVisitas.registrarSalida(req.params.id) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});

// --- RESIDENTES (AUTORIZACIONES Y PORTAL) ---
app.post('/api/invitaciones', (req, res) => {
    try {
        const idInv = 'V-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        res.json({ mensaje: controlVisitas.crearInvitacion(new Visita(idInv, req.body.nombre, req.body.depto, req.body.tipo)) });
    } catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/historial/:depto', (req, res) => {
    try { res.json(controlVisitas.obtenerVisitasPorDepto(parseInt(req.params.depto))); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});
app.get('/api/visitas/pendientes/:depto', (req, res) => {
    try { res.json(controlVisitas.obtenerPendientesPorDepto(parseInt(req.params.depto))); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});
app.put('/api/visitas/autorizar/:id', (req, res) => {
    try { res.json({ mensaje: controlVisitas.autorizarWalkIn(req.params.id) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});
app.put('/api/visitas/rechazar/:id', (req, res) => {
    try { res.json({ mensaje: controlVisitas.rechazarWalkIn(req.params.id) }); } 
    catch (error) { res.status(400).json({ error: error.message }); }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Backend corriendo en http://localhost:${PORT}`));