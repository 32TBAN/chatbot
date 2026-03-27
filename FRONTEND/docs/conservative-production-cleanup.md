## Limpieza conservadora previa a produccion

### Resumen
- El objetivo es quitar solo archivos y referencias claramente innecesarios antes de subir a produccion.
- El alcance cubre `FRONTEND`, `BACKEND` y documentacion relacionada.
- No se eliminan mocks que aun sirvan como fallback visual.
- No se toca codigo dudoso o no confirmado como muerto.

### Criterios de borrado
- Archivos generados que no deben versionarse.
- Documentacion de transicion ya superada y que hoy describe un estado falso del producto.
- Referencias legacy claramente reemplazadas.

### Candidatos confirmados
1. Archivos `*.tsbuildinfo` versionados en `FRONTEND`.
2. Documentos que aun describen `debug-section.tsx` como parte del flujo o como pendiente de borrar.

### Decision Log
- Decision: eliminar solo artefactos generados y docs claramente obsoletas.
  Alternatives: hacer una limpieza mayor de helpers, mocks y modulos.
  Why: esta pasada debe ser de bajo riesgo.
- Decision: conservar documentos tecnicos que aun describen el estado actual o sirven como historial util.
  Alternatives: borrar toda la carpeta `docs`.
  Why: no toda la documentacion intermedia es perjudicial.

### Validacion
1. Buscar referencias residuales tras la limpieza.
2. Compilar `FRONTEND`.
3. Compilar `BACKEND`.
