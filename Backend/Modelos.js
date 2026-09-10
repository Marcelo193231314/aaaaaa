export class Residente {
    constructor(id, nombre, telefono) {
        this.id = id;
        this.nombre = nombre;
        this.telefono = telefono;
    }
}

export class Visita {
    constructor(id, nombre, departamentoDestino, tipoVisita) {
        this.id = id;
        this.nombre = nombre;
        this.departamentoDestino = departamentoDestino;
        this.tipoVisita = tipoVisita;
        this.horaEntrada = null; 
        this.horaSalida = null;
        this.estado = "Esperando llegada"; 
    }
}

export class Departamento {
    constructor(numero) {
        this.numero = numero;
        this.residentes = [];
        this.historialVisitas = [];
    }
}