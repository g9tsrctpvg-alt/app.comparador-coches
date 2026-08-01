# Enrutado de modelos de IA por coste

> Este documento manda sobre **qué capacidad de modelo asume cada tipo de
> tarea** cuando la implementación la realiza una IA. Es agnóstico del
> proveedor concreto.

El enrutado se decide **por spec/tarea completa**, nunca por fragmentos dentro
de una misma tarea.

| Capacidad | Tareas |
| --- | --- |
| **Mayor capacidad** | Redacción de specs y ADRs, decisiones de arquitectura, y **revisión del diff** una vez la implementación está hecha y en verde |
| **Coste medio** | Implementación completa de una spec `approved` de principio a fin — código, tests, e **iterar los tests hasta que pasen** —, dejando la spec lista para `implemented`/`verified`. Es el modo por defecto para spec cerrada |
| **Bajo coste** | Solo tareas mecánicas sin ambigüedad: renombrados masivos, reformateo, andamiaje no productivo ya cubierto por 🟢 |

## Por qué no se parte una tarea

**Nunca se parte una misma tarea en «quien decide el detalle» / «quien teclea
sin reevaluar».** Ese reparto no ahorra:

- La parte cara de una sesión agéntica es **ingerir y razonar sobre el repo**,
  no escribir el código. Al partir, el contexto se paga dos veces.
- Una spec de implementación lo bastante cerrada como para no dejar decisiones
  abiertas **cuesta casi lo mismo que implementar**.
- «Picar líneas sin reevaluar» no existe como modo de operación: integrar
  implica micro-decisiones —imports, helpers existentes, estilo del repo— y,
  sobre todo, iterar sobre tests en rojo, que **es** reevaluar.

Ese es también el motivo de que `specs/` tenga dos niveles y no tres: un
tercer nivel de «detalle de implementación» solo existiría para alimentar ese
reparto.

## Escalado

Si el modelo de coste medio no puede completar una tarea —rojos persistentes,
ambigüedad de spec—, **se escala la tarea entera**, no se reparte a mitad de
camino. Si la causa es ambigüedad de la spec, la spec vuelve a `draft`: el
problema no es del implementador.
