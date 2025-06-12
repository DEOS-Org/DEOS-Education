"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.Horario = exports.Registro = exports.Huella = exports.DispositivoFichaje = exports.UsuarioCurso = exports.ProfesorMateria = exports.CursoDivisionMateria = exports.Materia = exports.CursoDivision = exports.Division = exports.Curso = exports.AlumnoPadre = exports.UsuarioRol = exports.Rol = exports.Usuario = exports.sequelize = exports.DiaSemana = exports.TipoLog = exports.TipoRegistro = void 0;
const db_1 = require("./db");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return db_1.sequelize; } });
const Usuario_1 = __importDefault(require("./Usuario"));
exports.Usuario = Usuario_1.default;
const Rol_1 = __importDefault(require("./Rol"));
exports.Rol = Rol_1.default;
const UsuarioRol_1 = __importDefault(require("./UsuarioRol"));
exports.UsuarioRol = UsuarioRol_1.default;
const AlumnoPadre_1 = __importDefault(require("./AlumnoPadre"));
exports.AlumnoPadre = AlumnoPadre_1.default;
const Curso_1 = __importDefault(require("./Curso"));
exports.Curso = Curso_1.default;
const Division_1 = __importDefault(require("./Division"));
exports.Division = Division_1.default;
const CursoDivision_1 = __importDefault(require("./CursoDivision"));
exports.CursoDivision = CursoDivision_1.default;
const Materia_1 = __importDefault(require("./Materia"));
exports.Materia = Materia_1.default;
const CursoDivisionMateria_1 = __importDefault(require("./CursoDivisionMateria"));
exports.CursoDivisionMateria = CursoDivisionMateria_1.default;
const ProfesorMateria_1 = __importDefault(require("./ProfesorMateria"));
exports.ProfesorMateria = ProfesorMateria_1.default;
const UsuarioCurso_1 = __importDefault(require("./UsuarioCurso"));
exports.UsuarioCurso = UsuarioCurso_1.default;
const DispositivoFichaje_1 = __importDefault(require("./DispositivoFichaje"));
exports.DispositivoFichaje = DispositivoFichaje_1.default;
const Huella_1 = __importDefault(require("./Huella"));
exports.Huella = Huella_1.default;
const Registro_1 = __importDefault(require("./Registro"));
exports.Registro = Registro_1.default;
const Horario_1 = __importDefault(require("./Horario"));
exports.Horario = Horario_1.default;
const Log_1 = __importDefault(require("./Log"));
exports.Log = Log_1.default;
// Re-exportar enums y tipos
var types_1 = require("./types");
Object.defineProperty(exports, "TipoRegistro", { enumerable: true, get: function () { return types_1.TipoRegistro; } });
Object.defineProperty(exports, "TipoLog", { enumerable: true, get: function () { return types_1.TipoLog; } });
Object.defineProperty(exports, "DiaSemana", { enumerable: true, get: function () { return types_1.DiaSemana; } });
// Establecer relaciones Usuario-Rol
Usuario_1.default.belongsToMany(Rol_1.default, {
    through: UsuarioRol_1.default,
    foreignKey: 'usuario_id',
    otherKey: 'rol_id'
});
Rol_1.default.belongsToMany(Usuario_1.default, {
    through: UsuarioRol_1.default,
    foreignKey: 'rol_id',
    otherKey: 'usuario_id'
});
// Relaciones Alumno-Padre
Usuario_1.default.belongsToMany(Usuario_1.default, {
    through: AlumnoPadre_1.default,
    as: 'AlumnoRelaciones',
    foreignKey: 'alumno_usuario_id',
    otherKey: 'padre_usuario_id'
});
Usuario_1.default.belongsToMany(Usuario_1.default, {
    through: AlumnoPadre_1.default,
    as: 'PadreRelaciones',
    foreignKey: 'padre_usuario_id',
    otherKey: 'alumno_usuario_id'
});
// Relaciones Curso-División
Curso_1.default.belongsToMany(Division_1.default, {
    through: CursoDivision_1.default,
    foreignKey: 'curso_id',
    otherKey: 'division_id'
});
Division_1.default.belongsToMany(Curso_1.default, {
    through: CursoDivision_1.default,
    foreignKey: 'division_id',
    otherKey: 'curso_id'
});
// Relaciones directas para CursoDivision
CursoDivision_1.default.belongsTo(Curso_1.default, { foreignKey: 'curso_id' });
CursoDivision_1.default.belongsTo(Division_1.default, { foreignKey: 'division_id' });
Curso_1.default.hasMany(CursoDivision_1.default, { foreignKey: 'curso_id' });
Division_1.default.hasMany(CursoDivision_1.default, { foreignKey: 'division_id' });
// Relaciones CursoDivision-Materia
CursoDivision_1.default.belongsToMany(Materia_1.default, {
    through: CursoDivisionMateria_1.default,
    foreignKey: 'curso_division_id',
    otherKey: 'materia_id'
});
Materia_1.default.belongsToMany(CursoDivision_1.default, {
    through: CursoDivisionMateria_1.default,
    foreignKey: 'materia_id',
    otherKey: 'curso_division_id'
});
// Relaciones básicas sin conflictos
// Comentadas temporalmente las relaciones complejas para evitar conflictos de alias
// Relaciones para Huella
Usuario_1.default.hasOne(Huella_1.default, { foreignKey: 'usuario_id', as: 'Huella' });
Huella_1.default.belongsTo(Usuario_1.default, { foreignKey: 'usuario_id', as: 'Usuario' });
// Relaciones para Registro
Usuario_1.default.hasMany(Registro_1.default, { foreignKey: 'usuario_id', as: 'Registros' });
Registro_1.default.belongsTo(Usuario_1.default, { foreignKey: 'usuario_id', as: 'Usuario' });
DispositivoFichaje_1.default.hasMany(Registro_1.default, { foreignKey: 'dispositivo_fichaje_id', as: 'RegistrosDispositivo' });
Registro_1.default.belongsTo(DispositivoFichaje_1.default, { foreignKey: 'dispositivo_fichaje_id', as: 'DispositivoFichaje' });
// Relaciones ProfesorMateria
ProfesorMateria_1.default.belongsTo(Usuario_1.default, { foreignKey: 'usuario_id' });
ProfesorMateria_1.default.belongsTo(Materia_1.default, { foreignKey: 'materia_id' });
Usuario_1.default.hasMany(ProfesorMateria_1.default, { foreignKey: 'usuario_id' });
Materia_1.default.hasMany(ProfesorMateria_1.default, { foreignKey: 'materia_id' });
// Relaciones básicas para funcionalidad mínima
Usuario_1.default.hasMany(Horario_1.default, { foreignKey: 'profesor_usuario_id', as: 'HorariosProfesor' });
Horario_1.default.belongsTo(Usuario_1.default, { foreignKey: 'profesor_usuario_id', as: 'Profesor' });
// Relaciones para Log
Usuario_1.default.hasMany(Log_1.default, { foreignKey: 'usuario_id', as: 'Logs' });
Log_1.default.belongsTo(Usuario_1.default, { foreignKey: 'usuario_id', as: 'Usuario' });
