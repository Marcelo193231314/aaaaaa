export class GestorVisitas {
    constructor(edificio) {
        this.edificio = edificio;
        this.visitasActivas = new Map(); 
        this.invitacionesPendientes = new Map(); 
        // NUEVO: Lista de espera en caseta
        this.visitasPorAutorizar = new Map(); 
    }

    crearInvitacion(visita) {
        const depto = this.edificio.obtenerDepartamento(visita.departamentoDestino);
        if (depto.residentes.length === 0) throw new Error(`El depto ${visita.departamentoDestino} está vacío.`);
        
        this.invitacionesPendientes.set(visita.id, visita);
        depto.historialVisitas.push(visita);
        return `✅ Invitación generada. Comparte el código: ${visita.id}`;
    }

    validarInvitacion(idVisita) {
        if (!this.invitacionesPendientes.has(idVisita)) throw new Error(`El código ${idVisita} no existe o ya se usó.`);

        const visita = this.invitacionesPendientes.get(idVisita);
        visita.estado = "En el edificio";
        visita.horaEntrada = new Date().toLocaleTimeString();

        this.invitacionesPendientes.delete(idVisita);
        this.visitasActivas.set(visita.id, visita);
        return `✅ Código válido. Acceso autorizado al depto ${visita.departamentoDestino}.`;
    }

    // ACTUALIZADO: El guardia los retiene, no los deja pasar aún
    registrarWalkIn(visita) {
        const depto = this.edificio.obtenerDepartamento(visita.departamentoDestino);
        if (depto.residentes.length === 0) throw new Error(`Nadie vive en el ${visita.departamentoDestino}.`);

        visita.estado = "Esperando autorización del residente";
        this.visitasPorAutorizar.set(visita.id, visita);
        
        return `⏳ Visita en espera. Avisa al residente del depto ${visita.departamentoDestino} para que autorice.`;
    }

    // NUEVO: El residente acepta
    autorizarWalkIn(idVisita) {
        if (!this.visitasPorAutorizar.has(idVisita)) throw new Error("La visita no está en espera.");
        
        const visita = this.visitasPorAutorizar.get(idVisita);
        visita.estado = "En el edificio (Aprobado)";
        visita.horaEntrada = new Date().toLocaleTimeString();

        this.visitasPorAutorizar.delete(idVisita);
        this.visitasActivas.set(idVisita, visita);
        
        const depto = this.edificio.obtenerDepartamento(visita.departamentoDestino);
        depto.historialVisitas.push(visita);
        return "✅ Visita autorizada. El guardia ya puede abrir la pluma.";
    }

    // NUEVO: El residente rechaza
    rechazarWalkIn(idVisita) {
        if (!this.visitasPorAutorizar.has(idVisita)) throw new Error("La visita no está en espera.");
        
        const visita = this.visitasPorAutorizar.get(idVisita);
        visita.estado = "Acceso Rechazado";
        
        this.visitasPorAutorizar.delete(idVisita);
        
        const depto = this.edificio.obtenerDepartamento(visita.departamentoDestino);
        depto.historialVisitas.push(visita);
        return "❌ Has denegado el acceso a esta persona.";
    }

    registrarSalida(idVisita) {
        if (!this.visitasActivas.has(idVisita)) throw new Error(`La visita no está en el edificio.`);
        
        const visita = this.visitasActivas.get(idVisita);
        visita.estado = "Finalizada";
        visita.horaSalida = new Date().toLocaleTimeString();
        this.visitasActivas.delete(idVisita); 
        return `✅ Salida registrada para ${visita.nombre}.`;
    }

    obtenerVisitasActivas() {
        return Array.from(this.visitasActivas.values());
    }

    obtenerTodasLasPendientes() {
        return Array.from(this.visitasPorAutorizar.values());
    }

    obtenerPendientesPorDepto(numeroDepto) {
        return Array.from(this.visitasPorAutorizar.values()).filter(v => v.departamentoDestino === numeroDepto);
    }

    obtenerVisitasPorDepto(numeroDepto) {
        return this.edificio.obtenerDepartamento(numeroDepto).historialVisitas;
    }
}