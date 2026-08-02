# Gates de calidad, CI y guardarraíles

> Este documento manda sobre **qué se verifica automáticamente, dónde y en qué
> orden**, y sobre **qué se ha aplazado y con qué disparador**.

## 1. Vocabulario

- Un **guardarrail** es la regla que se impone (formato, tipos, tests, no
  filtrar secretos).
- Un **hook** es el punto del ciclo donde esa regla se dispara (pre-commit
  local, CI en el PR, gate de despliegue).

## 2. Regla rectora

**La CI es la fuente de verdad; el hook local es comodidad.** Lo que se puede
saltar con `--no-verify` **no es un guardarrail real**. Un proyecto con solo
verificaciones locales no tiene guardarraíles, tiene buenas intenciones.

Corolario operativo: **el primer código del proyecto debe nacer ya gateado**.
Montar la CI después de tener código es pagar el coste de limpiar lo que ya se
coló. Por eso la CI existe desde antes de que exista código.

## 3. Suelo de CI

En cada push a la rama principal y en cada PR, en este orden:

1. **Lint + comprobación de formato** (no reformatea: falla).
2. **Tipado estático en modo estricto.**
3. **Contratos de arquitectura ejecutables** — la regla de dependencias no es
   una convención de buena voluntad, la impone una herramienta.
4. **Tests**, con **suelo de cobertura** por *ratcheting*: se fija al nivel que
   la suite alcanza hoy y **solo sube**, nunca baja.
5. **Escaneo de secretos** sobre el repositorio.
6. **Actualización automatizada de dependencias.**

## 4. Estado actual de la CI

El workflow vive en `.github/workflows/ci.yml`. El stack ya está decidido
(`docs/decisions/0003-stack.md`), pero los gates de código **no están
implementados**: los instala `technical/0001`, que sigue en `draft`. La
herramienta de cada uno ya no es una incógnita; su ausencia sí.

| Paso del suelo | Estado | Implementación |
| --- | --- | --- |
| Lint y formato de documentación | Activo | `markdownlint` sobre `**/*.md` |
| Enlaces de documentación | Activo | `lychee` sobre `**/*.md` |
| Coherencia de specs y ADRs | Activo | `scripts/validate_docs.py` |
| Escaneo de secretos | Activo | TruffleHog sobre el repositorio |
| Actualización de dependencias | Activo | Dependabot (`github-actions`) |
| Lint y formato de código | Pendiente | Prettier + ESLint, modo comprobación |
| Tipado estático estricto | Pendiente | `tsc --noEmit` con `strict` |
| Contratos de arquitectura | Pendiente | dependency-cruiser |
| Tests y suelo de cobertura | Pendiente | Vitest con cobertura v8 |
| Dependencias de la aplicación | Pendiente | Dependabot (`npm`) |

### Secuencia exacta en local

```bash
python3 scripts/validate_docs.py
npx --yes markdownlint-cli2 "**/*.md"
```

**Pásala entera antes de dar algo por hecho.** Los pasos de código se añaden a
esta secuencia al decidir el stack, y esta sección es su sitio: no se
documentan en dos lugares.

### Qué comprueba `validate_docs.py`

Traduce a comprobación mecánica las reglas de `ciclo-de-spec.md` y
`consolidacion.md` que se pueden verificar sin juicio humano:

- Nombrado `NNNN-titulo-en-kebab-case.md` y `NNNN` único por carpeta.
- Cabecera de campos completa, con `Estado` y `Tipo` de los valores
  permitidos, y `Id` coherente con la carpeta y el número del fichero.
- A partir de `approved`: hay criterios de aceptación y **no** quedan
  decisiones abiertas.
- `implemented` lleva el aviso A; `consolidated` lleva el aviso B y no el A.
- ADRs: cabecera completa y sección *Alternativas consideradas* no vacía.

Lo que **no** comprueba —y por tanto sigue siendo juicio humano— es si el
alcance es claro, si los criterios son realmente verificables y si el doc de
estado se actualizó de verdad al consolidar.

## 5. Lo que la CI no comprueba, lo declaras tú

Todo artefacto **generado y commiteado** —clientes tipados, snapshots de
contrato, esquemas— tiene un riesgo estructural: la CI puede comprobar que el
generado es coherente con su fuente, pero **no que la fuente refleje la
realidad**. Donde exista ese hueco:

- Se documenta **explícitamente** en el `CLAUDE.md` del área, con el comando
  de regeneración y la instrucción de commitear ambos ficheros juntos.
- Se asume como **deuda conocida**, no como descuido silencioso.

Si un diff de regeneración sale vacío, eso también es información útil: no
había cambio de contrato.

## 6. Branch protection

Recomendada: checks obligatorios + historia lineal. La revisión humana
obligatoria se calibra según el tamaño del equipo. Es una acción de
administración del repositorio, no un fichero: está pendiente y registrada en
`docs/roadmap.md`.

## 7. Calibración: no adoptar el suelo de la industria por defecto

El «suelo» habitual de guardarraíles y proceso está calibrado para equipos
grandes con consumidores externos. Aplicarlo entero desde el día uno a un
proyecto pequeño es **sobre-ingeniería**, y el coste no es solo de montaje: es
de fricción permanente.

La regla es: **se aplaza con disparador explícito, no se ignora**.

| Se aplaza | Disparador que lo reactiva |
| --- | --- |
| Detección de *breaking changes* y contract testing | Que exista un consumidor externo del contrato |
| SDK completo de observabilidad | Que exista un backend real al que exportar |
| Cobertura por *diff* en vez de suelo global | Que el suelo global deje de ser suficiente |
| Gates de CD (smoke tests, canary) | Que exista despliegue real |
| Suite E2E | Que la cobertura unitaria deje de detectar las regresiones que importan |
| Hooks de pre-commit locales | Que el ciclo de espera de CI moleste de verdad |

Un aplazamiento sin disparador es una omisión disfrazada. Un disparador que se
cumple y no se atiende es deuda: va al roadmap.
