# Marea BCS · Luna & Costa

Aplicación web interactiva para **Baja California Sur** que combina:
- Simulación lunar (fase, posición, orto/ocaso)
- Predicción de mareas con modelo armónico
- Visor GIS ligero (GeoJSON, KML, Shapefile, GeoPackage)

![Captura](https://via.placeholder.com/800x400?text=Marea+BCS+Screenshot)

## 🚀 Cómo usar

1. Abre [https://tuusuario.github.io/marea-bcs](https://tuusuario.github.io/marea-bcs)
2. Selecciona puerto, fecha y explora las pestañas **Luna**, **Mareas** y **Capas**.
3. Arrastra archivos GIS (GeoJSON, KML, .zip de shapefile, .gpkg).

## Características

- Totalmente **client-side** (funciona offline después de cargar)
- Soporta shapefiles y GeoPackage en el navegador
- Interpolación espacial de mareas (IDW)
- Gráficos interactivos con Chart.js

## Tecnologías

- Leaflet + OpenStreetMap
- Chart.js
- SQL.js (GeoPackage)
- JSZip (Shapefiles)

## Licencia

MIT - ver [LICENSE](LICENSE)
