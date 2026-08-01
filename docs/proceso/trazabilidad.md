# Trazabilidad: ramas, commits y PRs

> Este documento manda sobre **cómo queda registrado el trabajo en el
> historial**. El objetivo es que el historial deje ver el proceso, no solo el
> resultado.

## Ramas

- **Una rama por unidad de trabajo.**
- **Nunca se empuja a ramas ajenas sin permiso explícito** (🔴).
- La rama se nombra por lo que hace, no por quién la abre.

## Commits

Commits en **inglés**, estilo *conventional commits* con ámbito:

| Tipo | Cuándo |
| --- | --- |
| `feat(<app>)` | Comportamiento nuevo derivado de una spec aprobada |
| `fix(<app>)` | Corrección de comportamiento |
| `docs` | Docs de estado, satélites de proceso, ADRs |
| `specs` | Alta, aprobación o cambio de estado de una spec |
| `build` | Empaquetado, dependencias, CI |
| `style` | Formato sin cambio de comportamiento |
| `refactor` | Cambio interno sin cambio de comportamiento |
| `test` | Tests |
| `chore` | Mantenimiento sin efecto en el producto |

**Cada commit o PR de implementación referencia el `id` de la spec** (por
ejemplo `product/0003`). Así la trazabilidad spec → código es explícita y
auditable.

## Un commit por transición de ciclo de vida

```text
specs: draft technical/0031 and product/0029 for <asunto>
specs: approve technical/0031 and product/0029        ← el gate humano, solo
feat(api): <el cambio>                                 ← implementación
fix(web): <el cambio>
docs: consolidate technical/0031 and product/0029 into the state docs
```

El commit de aprobación **va solo**: es la evidencia auditable del gate. Un
diff que aprueba e implementa a la vez ha convertido el gate en un trámite
retroactivo.

## Pull requests

- La descripción del PR referencia el `id` de la spec y el estado al que la
  deja.
- Los checks de CI son obligatorios; ver `ci-y-guardarrailes.md`.
- La plantilla de PR está en `.github/pull_request_template.md`.

## Historia lineal

Se recomienda historia lineal (*rebase* o *squash*, no *merge commits*), de
forma que la secuencia de transiciones de ciclo de vida se lea en orden. La
configuración concreta de branch protection es una acción de administración
del repositorio y está pendiente: ver `docs/roadmap.md`.
