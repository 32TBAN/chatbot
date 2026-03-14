# Estabilizacion de Guardado y Runtime WhatsApp

## Resumen

- Guardar desde `automations-section.tsx` estaba disparando dos errores backend distintos.
- El primero era `Prisma P2028` dentro de `AutomationMainFlowService.save`.
- El segundo era un timeout de Puppeteer al restaurar sesiones de WhatsApp en `WhatsappRuntimeService`.
- La prioridad de este ajuste es estabilizar el guardado con una solucion conservadora.
- El runtime de WhatsApp debe degradar fallos de restauracion a un estado recuperable/manual.
- No se busca una refactorizacion profunda en esta iteracion.

## Supuestos

- La transaccion de Prisma puede requerir mas `maxWait` y `timeout` por la cantidad de operaciones secuenciales.
- Mantener toda la persistencia del flujo en una sola transaccion sigue siendo deseable en esta fase.
- El timeout de Puppeteer se puede mitigar con `protocolTimeout` mas alto.
- Si la restauracion automatica falla, la sesion debe quedar recuperable para activacion manual posterior.

## Decision Log

- Decision: mantener la transaccion de `save` y endurecer sus timeouts.
  Alternatives: reestructurar la persistencia o sacar pasos fuera de la transaccion.
  Why: es la solucion mas conservadora y de menor riesgo.
- Decision: mantener la restauracion automatica de WhatsApp.
  Alternatives: desactivarla temporalmente.
  Why: conserva la funcionalidad actual sin forzar intervencion manual siempre.
- Decision: tratar timeout de restauracion como fallo controlado.
  Alternatives: dejar que propague sin manejo especializado.
  Why: evita contaminar otros flujos del backend y deja la sesion recuperable.

## Diseno Final

En `BACKEND/src/modules/automation-main-flow/automation-main-flow.module.ts` se mantendra la transaccion interactiva de Prisma, pero se le asignaran `maxWait` y `timeout` explicitos mas tolerantes para evitar que expire mientras reescribe nodos y opciones del flujo principal.

En `BACKEND/src/modules/whatsapp-sessions/whatsapp-runtime.service.ts` se aumentara `protocolTimeout` de Puppeteer y se endurecera el manejo del fallo de `client.initialize()` cuando la activacion sea una restauracion automatica. Si ocurre un timeout, se limpiara el handle, se actualizara Prisma a un estado recuperable y se registrara el error sin dejar locks o clientes ambiguos.
