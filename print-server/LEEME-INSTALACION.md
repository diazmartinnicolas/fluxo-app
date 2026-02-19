# Guía de Instalación del Servidor de Impresión

Este documento explica cómo instalar el servidor de impresión en una computadora nueva.

## Requisitos Previos

1.  **Node.js**: Debes tener instalado Node.js.
    - Descárgalo gratis desde [nodejs.org](https://nodejs.org/).
    - Instala la versión LTS recomendada.
    - Durante la instalación, acepta todas las opciones por defecto.

## Pasos de Instalación

1.  **Copiar Archivos**:
    - Copia la carpeta `print-server` completa a la computadora donde está conectada la impresora.
    - Puedes ponerla en el Escritorio o en Documentos.

2.  **Iniciar Servidor**:
    - Abre la carpeta `print-server`.
    - Haz doble clic en el archivo `iniciar-print-server.bat`.
    - Se abrirá una ventana negra que mostrará:
      ```
      FLUXO PRINT SERVER v8 (Auto-Width)
      Estado: LISTO
      ```
    - **¡Listo!** Ya puedes imprimir desde cualquier dispositivo en la misma red Wi-Fi.

3.  **Configuración Automática (Zero Config)**:
    - Asegúrate de que tu impresora térmica esté instalada en Windows y configurada como **Impresora Predeterminada**.
    - El servidor detectará automáticamente si es de 58mm o 80mm.

## (Opcional) Inicio Automático

Si quieres que el servidor se inicie solo cuando prendes la computadora:

1.  Haz clic derecho en `instalar-autostart.bat`.
2.  Elige "Ejecutar como administrador".
3.  Presiona cualquier tecla cuando termine.
