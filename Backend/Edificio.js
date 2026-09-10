import { Departamento } from './Modelos.js';

export class Edificio {
    constructor() {
        this.departamentos = new Map();
        
        
        this.pisosTotales = 5;
        this.cuartosPorPiso = 4;
        
        this.inicializarEdificio();
    }

    inicializarEdificio() {
        
        for (let piso = 1; piso <= this.pisosTotales; piso++) {
            for (let cuarto = 1; cuarto <= this.cuartosPorPiso; cuarto++) {
                const numeroDepto = (piso * 100) + cuarto;
                this.departamentos.set(numeroDepto, new Departamento(numeroDepto));
            }
        }
    }

    obtenerDepartamento(numero) {
        if (!this.departamentos.has(numero)) {
            throw new Error(`El cuarto ${numero} no existe. El edificio tiene ${this.pisosTotales} pisos y ${this.cuartosPorPiso} cuartos por piso (Ej. del 101 al 504).`);
        }
        return this.departamentos.get(numero);
    }

    
    obtenerTodosLosDepartamentos() {
        return Array.from(this.departamentos.keys());
    }

    obtenerTodosLosResidentes() {
        let todos = [];
        for (const [numero, depto] of this.departamentos.entries()) {
            depto.residentes.forEach(res => {
                todos.push({ depto: numero, ...res });
            });
        }
        return todos;
    }
}