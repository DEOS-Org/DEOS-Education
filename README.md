# 📚 Sistema de Registro Biométrico - ETEC

Este proyecto implementa un sistema automático de registro de **ingresos y egresos** de alumnos mediante **lectura de huella digital**, desarrollado por estudiantes de 6° año de la Escuela Técnica de la Universidad de Mendoza (ETEC).

## 🚀 ¿Qué hace el sistema?

- Escanea la huella de cada alumno con el sensor AS608.
- Registra automáticamente la entrada o salida con hora y fecha.
- Muestra un mensaje personalizado en pantalla táctil.
- Guarda los datos en una base de datos local.
- Funciona sin internet (modo offline con sincronización).
- Proporciona una página web interna con estadísticas, reportes y paneles por curso.

## 🧰 Componentes utilizados

- ESP32 Wi-Fi + Bluetooth
- Sensor de huellas AS608
- Pantalla TFT táctil 2.8” a color
- Fuente 5V 2A
- Base de datos local (SQL/MongoDB)
- Sitio web responsive en red local

## 🌐 Funcionalidades del sitio web

- Panel general con gráficos en tiempo real
- Estado actual de alumnos (presentes / retirados)
- Filtros por curso, alumno y fecha
- Exportación de datos (CSV/PDF)
- Acceso exclusivo para preceptores y directivos
- Futuro soporte para integración con GoSchool

## 👥 Equipo de desarrollo

- Facundo Gonzalez  
- Facundo Llamas  
- Iñaki Gongora  

Escuela Técnica de la Universidad de Mendoza – 6° Año Informática

## 📦 Presupuesto estimado

Total: **$65.299 ARS**  
