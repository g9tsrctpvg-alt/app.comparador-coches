# comparador-coches — índice operativo

Punto de entrada del repositorio. Define principios, niveles de autonomía y
dónde vive cada cosa. **Es un índice, no un manual:** el detalle vive en los
satélites de `docs/proceso/` y, en caso de duda, manda el satélite.

> **Estado del proyecto:** aplicación en producción sobre GitHub Pages, con el
> catálogo, la clasificación y la ficha comparada implementados. Fase y deudas
> abiertas en `docs/roadmap.md`.

## 1. Parámetros del proyecto

| Marcador | Valor | Estado |
| --- | --- | --- |
| Nombre del proyecto | `comparador-coches` | Definido |
| Idioma de documentación | Español | Definido |
| Idioma de código y commits | Inglés | Definido |
| Stack | Vite · React · TypeScript · npm | Definido |
| Comandos de CI | Ver `docs/proceso/ci-y-guardarrailes.md` | Activo |
| Nombre de servicio en logs | `comparador-coches-web` | Definido |

El stack está decidido en `docs/decisions/0003-stack.md`: aplicación única,
SPA estática sin backend. El suelo de CI está completo y activo desde
`technical/0001` —los pasos, su orden y la secuencia exacta en local viven en
`docs/proceso/ci-y-guardarrailes.md` §4—; las deudas que quedan abiertas sobre
él están en `docs/roadmap.md`.

## 2. Principios rectores

- **IA-First.** La documentación es el contrato desde el que trabaja la IA.
  Debe estar desambiguada y ser navegable: si un documento admite dos
  lecturas, es un bug del documento. Se escribe para un agente que no
  recuerda la sesión anterior.
- **Spec-Driven.** La fuente de verdad de *qué* se construye son las specs.
  No se escribe código de producción sin una spec aprobada detrás. Flujo:
  `spec → validación humana → implementación → verificación → consolidación`.
- **Delta vs estado.** Una spec describe un **cambio fechado**; un doc de
  estado describe **cómo funciona el sistema hoy**. Para saber cómo se
  comporta el sistema hoy se lee el doc de estado, nunca una spec cerrada.
- **Idioma.** Documentación, specs y ADRs en español; identificadores,
  nombres de API y mensajes de commit en inglés. Sin mezclar dentro de un
  mismo artefacto.

Detalle de la estructura documental y de por qué «delta vs estado» no es un
tecnicismo: `docs/proceso/estructura-documental.md`.

## 3. Niveles de autonomía

| Nivel | Significado | Alcance |
| --- | --- | --- |
| 🟢 | Actúo e informo | Estructura documental, formato, naming, stubs y andamiaje no productivo, correcciones obvias |
| 🟡 | Propongo y validas | Arquitectura, stack, modelado de dominio, estructura de specs, cualquier dependencia nueva |
| 🔴 | Siempre pregunto | Credenciales y datos de terceros, seguridad y privacidad, proveedores externos, y toda acción irreversible o hacia fuera |

Cuando una tarea mezcla niveles gobierna **el más restrictivo**. Ante la duda
entre 🟡 y 🔴, es 🔴. Un nivel 🟢 **no** autoriza a saltarse el gate de spec:
son ejes independientes. Los símbolos 🟢/🟡/🔴 se reservan a este eje y no se
usan para estado de documentos.

## 4. Gate de spec

No se escribe código de producción sin una spec en estado `approved`. La
transición `draft → approved` la hace **una persona**, en un commit propio que
no contiene implementación. Es el único punto donde el proceso se detiene a
esperar, y es innegociable.

Estados, criterios de aprobación y verificación:
`docs/proceso/ciclo-de-spec.md`.

## 5. Mapa de navegación

| Documento | Propósito | Estado |
| --- | --- | --- |
| `docs/proceso/estructura-documental.md` | Qué artefacto responde a qué y dónde vive cada uno | Activo |
| `docs/proceso/ciclo-de-spec.md` | Estados de una spec, gate humano y verificación | Activo |
| `docs/proceso/consolidacion.md` | Cómo se pliega una spec en los docs de estado | Activo |
| `docs/proceso/adrs.md` | Cómo se registra el porqué de una decisión | Activo |
| `docs/proceso/ci-y-guardarrailes.md` | Guardarraíles, suelo de CI y aplazamientos | Activo |
| `docs/proceso/trazabilidad.md` | Ramas, commits y PRs | Activo |
| `docs/proceso/estilo.md` | Estilo de código, documentación y trabajo | Activo |
| `docs/proceso/logging.md` | Qué es un log en este proyecto | Activo |
| `docs/proceso/enrutado-de-modelos.md` | Qué modelo de IA hace qué tarea | Activo |
| `docs/proceso/calibracion-de-escalas.md` | Cómo se fija la escala de un eje y cómo se comprueba que mide lo que dice | Activo |
| `docs/proceso/anti-patrones.md` | Fallos que este proceso existe para evitar | Activo |
| `docs/estado/arquitectura.md` | Cómo está construido el sistema hoy | Activo |
| `docs/estado/dominio.md` | Qué modela el negocio hoy | Activo |
| `docs/estado/interfaz.md` | Cómo se ve y se usa la aplicación hoy | Activo |
| `docs/estado/despliegue.md` | Cómo se construye y despliega hoy | Activo |
| `docs/decisions/` | ADRs: el porqué de cada decisión estructural | Activo |
| `docs/roadmap.md` | Seguimiento único: fases, tareas, deudas y propuestas | Activo |
| `specs/product/` | Qué hace el negocio | Base |
| `specs/technical/` | Cómo se implementa | Base |
| `specs/TEMPLATE.md` | Plantilla única de spec | Activo |

Etiquetas de estado: `Pendiente` · `Base` · `Definido` · `Activo`.

## 6. Cómo trabajar aquí

1. **Antes de tocar un área, lee su doc de estado**, no sus specs.
2. Si el cambio afecta a producción, comprueba que existe una spec
   `approved`. Si no existe, el trabajo es redactarla, no implementarla.
3. Una rama por unidad de trabajo. Commits en inglés, *conventional commits*,
   referenciando el `id` de la spec.
4. Un commit por transición de ciclo de vida; el de aprobación va solo.
5. **Antes de dar algo por hecho, pasa la CI entera en local.**
6. Al terminar, consolida: el comportamiento nuevo debe poder leerse en un
   doc de estado sin abrir la spec.

Los fallos concretos que este proceso evita están enumerados en
`docs/proceso/anti-patrones.md`. Si te descubres en uno, párate.
