# 0002 — Adopción del modelo de trabajo y estructura documental

- **Estado:** approved
- **Fecha:** 2026-08-01
- **Nivel:** 🟡

## Contexto

El repositorio arranca vacío. Existe un contrato de trabajo IA-First y
spec-driven que define principios, ciclo de vida de las specs, consolidación,
ADRs, guardarraíles y estilo, pero es un documento de proceso genérico con
marcadores sin instanciar: hay que decidir **cómo se materializa en este
repositorio concreto** antes de escribir nada.

Las decisiones abiertas eran cuatro: dónde vive el contrato, qué docs de
estado se crean de entrada, si la CI se monta antes o después de tener stack,
y qué se registra como ADR desde el principio. El stack queda explícitamente
fuera: se decide más adelante.

## Decisión

1. **`CLAUDE.md` es un índice ligero** —principios, niveles de autonomía, mapa
   de navegación— y el contrato se parte en satélites temáticos bajo
   `docs/proceso/`, uno por área: estructura documental, ciclo de spec,
   consolidación, ADRs, CI y guardarraíles, trazabilidad, estilo, logging,
   enrutado de modelos y anti-patrones.
2. **`docs/` se separa en `docs/proceso/` y `docs/estado/`.** Los primeros
   describen cómo se trabaja; los segundos, qué hay construido, y solo se
   editan al consolidar una spec.
3. **Se crean tres docs de estado** —arquitectura, dominio, despliegue—
   marcados `Pendiente`, con lo que los desbloquea. Las otras seis áreas del
   catálogo se crean cuando la primera spec que les afecte las declare como
   destino.
4. **La CI se monta antes que el código**, con los gates que no dependen del
   stack: escaneo de secretos, lint de Markdown, comprobación de enlaces,
   validación de cabeceras de spec y ADR, y actualización de dependencias.
5. **Se registran dos ADRs semilla:** el formato de logs (0001, heredado del
   contrato) y este.
6. **Parámetros instanciados:** nombre `comparador-coches`, documentación en
   español, código y mensajes de commit en inglés.

## Alternativas consideradas

- **Contrato íntegro como `CLAUDE.md`.** Un solo fichero, cero navegación.
  Descartada: incumple la regla de ligereza del índice del propio contrato, y
  un índice de ~600 líneas deja de releerse entero, que es justo lo que el
  índice existe para permitir.
- **Índice + un único satélite con todo el contrato.** Menos ficheros.
  Descartada por lo mismo: mueve el problema de sitio sin resolverlo, y
  además impide enlazar un área concreta desde una spec o un PR.
- **`docs/` plano, con docs de estado y satélites de proceso mezclados.** Es
  la lectura literal del contrato. Descartada porque obliga a recordar cuáles
  se rigen por las reglas de consolidación y cuáles no; la separación en dos
  carpetas hace esa distinción evidente sin memoria previa. Es un refinamiento
  del contrato, no una desviación de sus reglas.
- **Crear los nueve docs de estado del catálogo como stubs.** Deja preparado
  el destino de cualquier spec futura. Descartada: seis de ellos no tendrían
  contenido ni previsión de tenerlo a corto plazo, y un doc de estado vacío
  compite con el roadmap como sitio donde mirar. El catálogo completo queda
  documentado en `docs/proceso/consolidacion.md`, §4.
- **Esperar al stack para montar la CI.** Un único workflow completo de una
  vez. Descartada: el contrato exige que el primer código nazca ya gateado, y
  los gates documentales son precisamente los que protegen el artefacto que
  hoy es el único que existe.
- **No registrar ADRs hasta la decisión de stack.** Descartada: la decisión de
  logs llega con contexto y alternativas ya razonados, y perderlos por no
  tener aún dónde ponerlos sería tirar trabajo hecho.

## Consecuencias

- Cualquier agente que entre en frío tiene un punto de entrada corto y un mapa
  de navegación explícito, en lugar de un documento largo que debe leer entero
  para saber si le aplica.
- Un cambio de proceso toca **un** satélite y se registra como ADR, en lugar
  de editar un documento monolítico donde el diff no dice de qué área es.
- **Coste asumido:** más ficheros y más enlaces internos que mantener. Se
  mitiga con la comprobación de enlaces en CI.
- Las seis áreas de estado que no existen son un hueco **declarado**, no
  silencioso: están en el catálogo de `consolidacion.md` §4 y en el roadmap.
- La CI valida la coherencia de specs y ADRs con `scripts/validateDocs.ts`,
  que corre bajo Vitest dentro del paso de tests. La decisión es que esa
  coherencia se comprueba **mecánicamente**; con qué herramienta es
  circunstancial.
- Los gates de código quedan **aplazados con disparador**: la decisión de
  stack. Mientras tanto, el suelo de CI está declarado incompleto en
  `docs/proceso/ci-y-guardarrailes.md`, §4.

## Historial

- **2026-08-01** — ADR creado. El validador era `scripts/validate_docs.py`
  (Python 3, solo biblioteca estándar), elegido como provisional porque
  todavía no había stack: **disparador** para revisarlo, que el stack elegido
  trajera un runtime propio con el que fuese más natural mantenerlo.
- **2026-08-03** — Ese disparador se cumplió con el ADR 0003 y
  `technical/0001`. `technical/0003` portó el validador a
  `scripts/validateDocs.ts`, trasladando las veinte condiciones de error una a
  una y añadiendo el test que a la versión en Python le faltaba; la CI ya no
  arranca Python en ningún *job*. La decisión de fondo no cambia, solo la
  herramienta.
