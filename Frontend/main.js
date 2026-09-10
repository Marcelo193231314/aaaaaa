async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(endpoint, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

window.iniciarSesion = (rol) => {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'flex';
    document.getElementById('menu-admin').style.display = 'none';
    document.getElementById('menu-guardia').style.display = 'none';
    document.getElementById('menu-residente').style.display = 'none';

    if (rol === 'admin') {
        document.getElementById('menu-admin').style.display = 'block';
        window.mostrarSeccion('residentes');
        actualizarUIAdmin();
    } else if (rol === 'guardia') {
        document.getElementById('menu-guardia').style.display = 'block';
        window.mostrarSeccion('visitas');
        actualizarUICaseta();
    } else if (rol === 'residente') {
        document.getElementById('menu-residente').style.display = 'block';
        window.mostrarSeccion('portal-residente');
    }
};

window.cerrarSesion = () => {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-dashboard').style.display = 'none';
};


async function actualizarUIAdmin() {
    try {
        const datos = await apiCall('/api/admin/datos');
        document.getElementById('resDepto').innerHTML = '<option value="">Selecciona el cuarto...</option>' + 
            datos.disponibles.map(num => `<option value="${num}">Cuarto ${num}</option>`).join('');

        const tbodyRes = document.getElementById('tablaResidentes');
        tbodyRes.innerHTML = datos.residentes.length === 0 ? '<tr><td colspan="4" class="text-center">Sin habitantes</td></tr>' : datos.residentes.map(r => `
            <tr>
                <td><strong>${r.depto}</strong></td><td>${r.nombre}</td><td>${r.telefono}</td>
                <td style="display: flex; gap: 5px;">
                    <button onclick="window.editarResidente('${r.id}', '${r.nombre}', '${r.telefono}')" class="btn-primary btn-sm">Editar</button>
                    <button onclick="window.darDeBaja('${r.id}')" class="btn-danger btn-sm">Baja</button>
                </td>
            </tr>
        `).join('');
    } catch (error) { console.error(error); }
}

window.actualizarUICaseta = async () => {
    try {
        
        const pendientes = await apiCall('/api/caseta/pendientes');
        const tbodyPendientes = document.getElementById('tablaVisitasPendientesGuardia');
        tbodyPendientes.innerHTML = pendientes.length === 0 ? '<tr><td colspan="2" class="text-center">Pluma libre</td></tr>' : pendientes.map(p => `
            <tr><td>${p.nombre}</td><td>Esperando al <strong>${p.departamentoDestino}</strong></td></tr>
        `).join('');

        
        const activas = await apiCall('/api/caseta/activas');
        const tbodyVis = document.getElementById('tablaVisitasActivas');
        tbodyVis.innerHTML = activas.length === 0 ? '<tr><td colspan="4" class="text-center">Nadie adentro</td></tr>' : activas.map(v => `
            <tr><td>${v.nombre}</td><td><strong>${v.departamentoDestino}</strong></td><td>${v.horaEntrada}</td><td><button onclick="window.marcarSalida('${v.id}')" class="btn-warning btn-sm">Salió</button></td></tr>
        `).join('');
    } catch (error) { console.error(error); }
};


async function cargarDatosResidente(depto) {
    const contPendientes = document.getElementById('listaAutorizacionesPendientes');
    const contHistorial = document.getElementById('listaMisVisitas');
    
    try {
        
        const alertas = await apiCall(`/api/visitas/pendientes/${depto}`);
        if (alertas.length > 0) {
            contPendientes.innerHTML = '<h4 style="color: #dc3545;">⚠️ ¡ALGUIEN ESTÁ EN LA PUERTA!</h4>' + alertas.map(v => `
                <div style="border: 2px solid #dc3545; padding: 15px; background: #fff3f3; margin-bottom: 15px; border-radius: 8px;">
                    <strong>${v.nombre}</strong> quiere entrar <small>(${v.tipoVisita})</small><br><br>
                    <button onclick="window.autorizarVisita('${v.id}', ${depto})" class="btn-success">✅ Dejar pasar</button>
                    <button onclick="window.rechazarVisita('${v.id}', ${depto})" class="btn-danger" style="margin-left: 10px;">❌ Rechazar acceso</button>
                </div>
            `).join('');
        } else {
            contPendientes.innerHTML = ''; 
        }

        
        const misVisitas = await apiCall(`/api/historial/${depto}`);
        contHistorial.innerHTML = misVisitas.length === 0 ? '<p class="text-muted">Aún no tienes visitas en el historial.</p>' : misVisitas.map(v => `
            <div style="border-left: 4px solid ${v.estado === 'Acceso Rechazado' ? '#dc3545' : (v.estado === 'Finalizada' ? '#6c757d' : '#28a745')}; padding: 10px; background: #f8f9fa; margin-bottom: 10px;">
                <strong>${v.nombre}</strong><br>
                <small>Estado: <strong>${v.estado}</strong> ${v.horaEntrada ? `| Entró: ${v.horaEntrada}` : ''}</small>
            </div>
        `).reverse().join('');
    } catch (error) { contHistorial.innerHTML = `<p style="color: red;">${error.message}</p>`; }
}


window.autorizarVisita = async (id, depto) => {
    try {
        const res = await apiCall(`/api/visitas/autorizar/${id}`, 'PUT');
        alert(res.mensaje);
        cargarDatosResidente(depto); 
    } catch (error) { alert(error.message); }
};

window.rechazarVisita = async (id, depto) => {
    try {
        const res = await apiCall(`/api/visitas/rechazar/${id}`, 'PUT');
        alert(res.mensaje);
        cargarDatosResidente(depto);
    } catch (error) { alert(error.message); }
};

window.darDeBaja = async (id) => {
    if (confirm('¿Dar de baja?')) { await apiCall(`/api/residentes/${id}`, 'DELETE'); actualizarUIAdmin(); }
};
window.editarResidente = async (id, nombreActual, telActual) => {
    const nombre = prompt("Nuevo nombre:", nombreActual);
    if (!nombre) return;
    const tel = prompt("Nuevo teléfono:", telActual);
    if (!tel) return;
    await apiCall(`/api/residentes/${id}`, 'PUT', { nombre, telefono: tel });
    actualizarUIAdmin();
};
window.marcarSalida = async (id) => {
    await apiCall(`/api/visitas/salida/${id}`, 'PUT');
    actualizarUICaseta();
};


document.getElementById('formResidente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msj = document.getElementById('mensajeResidente');
    try {
        const body = { depto: parseInt(document.getElementById('resDepto').value), nombre: document.getElementById('resNombre').value, telefono: document.getElementById('resTel').value };
        const res = await apiCall('/api/residentes', 'POST', body);
        msj.innerHTML = `<span style="color: green;">${res.mensaje}</span>`;
        e.target.reset(); actualizarUIAdmin();
    } catch (error) { msj.innerHTML = `<span style="color: red;">${error.message}</span>`; }
});

document.getElementById('formValidarCodigo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msj = document.getElementById('mensajeValidacion');
    try {
        const res = await apiCall('/api/visitas/validar', 'POST', { codigo: document.getElementById('codigoAcceso').value.trim() });
        msj.innerHTML = `<span style="color: green;">${res.mensaje}</span>`;
        e.target.reset(); actualizarUICaseta();
    } catch (error) { msj.innerHTML = `<span style="color: red;">${error.message}</span>`; }
});

document.getElementById('formVisitaWalkIn').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msj = document.getElementById('mensajeVisitaWalkIn');
    try {
        const body = { nombre: document.getElementById('visNombre').value, depto: parseInt(document.getElementById('visDepto').value), tipo: document.getElementById('visTipo').value };
        const res = await apiCall('/api/visitas/manual', 'POST', body);
        msj.innerHTML = `<span style="color: green;">${res.mensaje}</span>`;
        e.target.reset(); actualizarUICaseta();
    } catch (error) { msj.innerHTML = `<span style="color: red;">${error.message}</span>`; }
});

document.getElementById('formCrearInvitacion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msj = document.getElementById('mensajeInvitacion');
    try {
        const body = { depto: parseInt(document.getElementById('invDepto').value), nombre: document.getElementById('invNombre').value, tipo: document.getElementById('invTipo').value };
        const res = await apiCall('/api/invitaciones', 'POST', body);
        msj.innerHTML = `<span style="color: green; font-weight: bold;">${res.mensaje}</span>`;
        e.target.reset();
    } catch (error) { msj.innerHTML = `<span style="color: red;">${error.message}</span>`; }
});

document.getElementById('formMisVisitas').addEventListener('submit', (e) => {
    e.preventDefault();
    cargarDatosResidente(parseInt(document.getElementById('miNumDepto').value));
});