# Marea BCS · Luna & Costa

Una aplicación web interactiva e integral diseñada en entorno oscuro para el monitoreo y simulación astronómica de mareas en Baja California Sur, combinada con un visor de capas de Sistemas de Información Geográfica (SIG/GIS).

## Características principales

- **Simulación Lunar Avanzada:** Cálculos en tiempo real de la fase lunar, porcentaje de iluminación, edad sinódica, azimut, altitud, orto y ocaso de la Luna ajustados por puerto.
- **Predicción y Modelado Armónico:** Gráfico dinámico de 48 horas de la curva sinusoidal de la marea implementado con `Chart.js` y adaptadores temporales, permitiendo la personalización manual e importación en formato CSV de los constituyentes armónicos principales ($Z_0, M_2, S2, N_2, K_1, O_1$).
- **Visor Geográfico e Interpolación (IDW):** Renderizado en mapa interactivo con `Leaflet` de las lecturas actuales de marea por puerto. Permite la carga dinámica mediante drag-and-drop de archivos **GeoJSON, KML, Shapefiles comprimidos (.zip)** e incluso **GeoPackages (.gpkg)** procesados en el navegador mediante bases de datos SQLite compiladas en WebAssembly (`SQL.js`).
- **Línea de Costa Dinámica:** Capacidad de capturar e interpolar espacialmente los constituyentes armónicos mediante el método de Distancia Inversa Ponderada (IDW) sobre cualquier polígono o línea de costa cargada, tiñendo los segmentos del mapa según el nivel relativo de la marea.

## Tecnologías Utilizadas

- **HTML5, CSS3 Custom Properties & JavaScript (ES6+)**
- **Leaflet v1.9.4** - Mapeo interactivo.
- **Chart.js v4.4.0** - Visualización temporal de la curva de marea.
- **JSZip v3.10.1** - Descompresión en caliente de Shapefiles.
- **SQL.js v1.8.0 (WebAssembly)** - Motor de base de datos relacional incrustado para la lectura nativa de archivos GeoPackage.

## Uso e Instalación

No requiere servidores ni dependencias pesadas de backend. Al ser código puramente front-end, basta con clonar el repositorio y ejecutar el archivo `index.html` en cualquier navegador web moderno, o desplegarlo directamente usando **GitHub Pages**.