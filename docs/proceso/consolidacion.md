# Consolidación

> Este documento manda sobre **cómo se pliega el efecto de una spec en los
> docs de estado** y sobre **cuándo se puede leer una spec y para qué**.

Es el paso que la mayoría de procesos spec-driven omiten, y el que evita que
la documentación se convierta en un archivo arqueológico.

## 1. Mecánica

1. **Actualizar el/los doc(s) de estado** declarados en el campo *Doc de
   estado*, de forma que describan el comportamiento vigente **en presente** y
   sin referencias al cambio ni al estado anterior.
2. **Estampar el aviso** correspondiente en la spec, inmediatamente después de
   la cabecera de campos y **antes** de cualquier nota de revisión previa.
3. **Poner `Estado: consolidated`.**

Los tres pasos van **en el mismo commit**. Una spec marcada `consolidated`
cuyo doc de estado no se actualizó es **peor** que no haberla consolidado:
afirma una propiedad falsa sobre dónde vive la verdad.

## 2. Los dos avisos

Son dos, según lo que sea cierto en cada momento. Se copian literalmente: la
CI comprueba que el aviso presente corresponde al estado declarado.

**A — al pasar a `implemented`.** El *Contexto* ya no es cierto, pero los docs
de estado aún no recogen el cambio:

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

**B — al consolidar.** Sustituye al aviso A:

> ⚠️ **Spec consolidada (AAAA-MM-DD).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver `<doc de estado>`.
> Vigentes aquí solo los **criterios de aceptación**, como registro de
> verificación.

La diferencia importa: **el aviso B afirma que el estado vigente ya se puede
leer en los docs**, y eso solo es cierto una vez hecha la consolidación.
Estamparlo antes es exactamente el fallo que este flujo persigue.

## 3. Regla de lectura

- Una spec `consolidated` **no se lee para obtener contexto** sobre cómo
  funciona el sistema. Se consulta **solo para auditoría**: qué cambió,
  cuándo, con qué criterios y contra qué ADR.
- Una spec consolidada **no se edita**. Si el comportamiento vuelve a cambiar,
  eso es una **spec nueva**, que a su vez se consolidará sobre el mismo doc de
  estado.
- Antes de tocar código de un área, **lee su doc de estado**, no sus specs.

## 4. Qué doc recibe qué

El campo *Doc de estado* de cada spec lo declara explícitamente. Como guía por
defecto, cada área funcional tiene un único doc de estado responsable:

| Área | Doc de estado |
| --- | --- |
| Arquitectura | `docs/estado/arquitectura.md` |
| Dominio | `docs/estado/dominio.md` |
| Infraestructura y despliegue | `docs/estado/despliegue.md` |
| Interfaz de usuario | `docs/estado/interfaz.md` — pendiente de crear |
| Modelo de datos | `docs/estado/datos.md` — pendiente de crear |
| Observabilidad | `docs/estado/observabilidad.md` — pendiente de crear |

Los pendientes se crean cuando la primera spec que les afecte los declare como
destino; hasta entonces no existirían más que como stubs vacíos. El
seguimiento está en `docs/roadmap.md`.

Tres áreas del catálogo por defecto **no aplican** a este proyecto mientras
siga siendo una SPA estática sin backend: contratos de API, integraciones
externas y autenticación. No hay servidor, ni terceros, ni identidad. Si
alguna aparece, aparece con su spec y con su doc de estado.

Si una spec no encaja en ninguno, la pregunta no es dónde meterla: es si falta
un doc de estado.
