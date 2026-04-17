const { processPdf } = require('firecrawl-pdf-inspector');
const fs = require('fs');
const path = require('path');

// Este script es solo para verificar que la librería se cargó correctamente
try {
    console.log("Comprobando firecrawl-pdf-inspector...");
    if (typeof processPdf === 'function') {
        console.log("✅ processPdf está disponible.");
    } else {
        console.log("❌ processPdf NO es una función.");
    }
} catch (e) {
    console.error("Error al cargar la librería:", e);
}
