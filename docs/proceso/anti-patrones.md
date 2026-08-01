# Anti-patrones del modelo de trabajo

> Este documento manda sobre **qué señales obligan a parar**. Es una lista de
> comprobación, no una reflexión: si te descubres haciendo alguno de estos,
> párate antes de continuar.

1. **Implementar sin spec `approved`** porque «es un cambio pequeño». El
   tamaño del cambio no es el criterio; el gate lo es.
2. **Aprobar e implementar en el mismo diff.** Convierte el gate humano en un
   trámite retroactivo.
3. **Reconstruir el estado del sistema leyendo specs.** Su *Contexto* es falso
   por diseño desde el momento en que se implementaron.
4. **Marcar `consolidated` sin actualizar el doc de estado.** Afirma que la
   verdad está en un sitio donde no está.
5. **Editar una spec consolidada.** Un cambio de comportamiento es una spec
   nueva, siempre.
6. **Dejar la verdad solo en el código.** Si el comportamiento vigente no se
   puede leer en un doc de estado, no está documentado.
7. **Aplazar sin disparador.** Es una omisión con mejor nombre.
8. **Confiar en hooks locales como guardarrail.** Lo que se salta con
   `--no-verify` no protege nada.
9. **Partir una tarea entre un modelo que decide y otro que teclea.** No
   ahorra y añade riesgo de integración.
10. **Loguear objetos en vez de campos de allow-list.** La disciplina de
    redacción no puede depender de la memoria.

## Cómo usar esta lista

Está pensada para leerse **antes de abrir un diff grande** y **antes de cerrar
una unidad de trabajo**. Cada punto tiene su regla completa en el satélite
correspondiente:

| Anti-patrón | Regla completa |
| --- | --- |
| 1, 2 | `ciclo-de-spec.md` |
| 3, 4, 5, 6 | `consolidacion.md` |
| 7 | `ci-y-guardarrailes.md` |
| 8 | `ci-y-guardarrailes.md` |
| 9 | `enrutado-de-modelos.md` |
| 10 | `logging.md` |
