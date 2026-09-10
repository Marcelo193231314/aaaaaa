export class GestorResidentes {
    constructor(edificio) {
        this.edificio = edificio;
    }

    altaResidente(numeroDepto, residente) {
        const depto = this.edificio.obtenerDepartamento(numeroDepto);
        
        
        const existe = depto.residentes.some(r => r.nombre.toLowerCase() === residente.nombre.toLowerCase());
        if (existe) {
            throw new Error(`${residente.nombre} ya está registrado en este cuarto.`);
        }

        
        depto.residentes.push(residente);
        return `✅ ${residente.nombre} registrado en cuarto ${numeroDepto}. ID: ${residente.id}`;
    }

    modificarResidente(idResidente, nuevosDatos) {
        for (const [numero, depto] of this.edificio.departamentos.entries()) {
            const index = depto.residentes.findIndex(r => r.id === idResidente);
            if (index !== -1) {
                depto.residentes[index] = { ...depto.residentes[index], ...nuevosDatos };
                return `✅ Datos actualizados correctamente.`;
            }
        }
        throw new Error(`Residente no encontrado.`);
    }

    bajaResidente(idResidente) {
        for (const [numero, depto] of this.edificio.departamentos.entries()) {
            const index = depto.residentes.findIndex(r => r.id === idResidente);
            if (index !== -1) {
                const nombre = depto.residentes[index].nombre;
                depto.residentes.splice(index, 1);
                return `✅ ${nombre} dado de baja exitosamente del cuarto ${numero}.`;
            }
        }
        throw new Error(`No se encontró ningún residente con el ID ${idResidente}.`);
    }
}