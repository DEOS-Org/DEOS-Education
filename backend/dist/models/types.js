"use strict";
// Enums y tipos compartidos para los modelos
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaSemana = exports.TipoLog = exports.TipoRegistro = void 0;
var TipoRegistro;
(function (TipoRegistro) {
    TipoRegistro["INGRESO"] = "ingreso";
    TipoRegistro["EGRESO"] = "egreso";
})(TipoRegistro || (exports.TipoRegistro = TipoRegistro = {}));
var TipoLog;
(function (TipoLog) {
    TipoLog["ERROR"] = "error";
    TipoLog["INFO"] = "info";
    TipoLog["WARNING"] = "warning";
    TipoLog["AUDITORIA"] = "auditoria";
    TipoLog["SEGURIDAD"] = "seguridad";
})(TipoLog || (exports.TipoLog = TipoLog = {}));
var DiaSemana;
(function (DiaSemana) {
    DiaSemana["LUNES"] = "Lunes";
    DiaSemana["MARTES"] = "Martes";
    DiaSemana["MIERCOLES"] = "Mi\u00E9rcoles";
    DiaSemana["JUEVES"] = "Jueves";
    DiaSemana["VIERNES"] = "Viernes";
    DiaSemana["SABADO"] = "S\u00E1bado";
    DiaSemana["DOMINGO"] = "Domingo";
})(DiaSemana || (exports.DiaSemana = DiaSemana = {}));
