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

El workflow vive en `.github/workflows/ci.yml`. Con `technical/0001`
implementada, el suelo de CI está completo: los seis pasos del §3 están
activos, en el mismo orden en que aparecen ahí.

| Paso del suelo | Estado | Implementación |
| --- | --- | --- |
| Lint y formato de código | Activo | Prettier + ESLint, modo comprobación |
| Tipado estático estricto | Activo | `tsc --noEmit` con `strict` |
| Contratos de arquitectura | Activo | dependency-cruiser (`domain/` no importa `ui/`, React ni React DOM) |
| Tests y suelo de cobertura | Activo | Vitest con cobertura v8, suelo al 100% en `domain/`, `data/` y `logging/`; el job `test` añade después `npm run test:recovery` (ver abajo) |
| Lint y formato de documentación | Activo | `markdownlint` sobre `**/*.md` |
| Enlaces de documentación | Activo | `lychee` sobre `**/*.md` |
| Coherencia de specs y ADRs | Activo | `scripts/validateDocs.ts`, bajo Vitest |
| Escaneo de secretos | Activo | TruffleHog sobre el repositorio |
| Actualización de dependencias | Activo | Dependabot (`github-actions`, `npm`) |

Los *jobs* del workflow están encadenados con `needs` en este orden:
`lint → typecheck → architecture → test → docs → links → secrets`. `build`
depende de `test` y corre en todo push y PR; `deploy` depende de `build` y
solo se ejecuta en push a `main`, publicando a GitHub Pages.

### Secuencia exacta en local

```bash
npm run format:check
npm run lint
npm run typecheck
npm run arch:check
npm run test:coverage
npx --yes markdownlint-cli2 "**/*.md"
npm run build
```

La coherencia de specs y ADRs ya va dentro de `npm run test:coverage`: el
validador corre bajo Vitest, no como paso aparte.

**Pásala entera antes de dar algo por hecho.**

### El paso que no está en la secuencia: `npm run test:recovery`

Hay **una** comprobación fuera de la secuencia de arriba: la medición
empírica que sostiene los criterios de `product/0035` sobre lo que una tanda
de calibración recupera (`src/domain/calibration.recovery.test.ts`). No entra
en `npm run test:coverage` porque bajo la instrumentación de cobertura pasa
de 17 segundos a dos minutos y medio, y eso desincentiva justo lo que la
regla de arriba manda: pasar la tanda entera antes de afirmar nada. Suelta,
sin cobertura, tarda **17 segundos**.

**Estar fuera de la secuencia local no la hace opcional: corre siempre en
CI**, como paso del job `test`, en cada `push` y cada `pull_request`. La
garantía es mecánica y no depende de que nadie se acuerde — que es justo lo
que exige el principio IA-First, porque quien trabaja aquí mañana no recuerda
esta sesión. En local es una conveniencia para no descubrir el fallo en CI,
no la garantía.

**Cuándo conviene ejecutarla en local.** La condición es mecánica, no un
juicio — toca una de estas y la medición puede cambiar; no toques ninguna y
no puede:

- `src/domain/calibration.ts`;
- cualquier eje de `src/domain/scoring/`, o la forma de puntuar;
- `DEFAULT_WEIGHTS` (`src/domain/scoring/weights.ts`);
- `src/data/cars.json`.

Son las cuatro entradas de la medición. Si el cambio no toca ninguna, no hay
nada que volver a medir. Si toca alguna, se ejecuta sin preguntar a nadie:
son 17 segundos, y deliberar sale más caro que medir.

### Suelo de cobertura

Se fija por *ratcheting*, al nivel que alcanza la suite hoy: el 100% de
líneas, sentencias y funciones en `src/domain/`, `src/data/` y
`src/logging/` (`vite.config.ts`, bloque `test.coverage`). `src/ui/` y
`src/main.tsx` quedan **excluidos** de la medición: hoy son andamiaje mínimo
de cableado, sin la lógica que introducirá `product/0001`, y exigirles el
mismo suelo forzaría a testear una interfaz que va a rehacerse. Se incluyen
en el suelo cuando dejen de ser eso — ver `docs/roadmap.md`.

Dos ramas de `src/data/loadCatalog.ts` que TypeScript exige por
`noUncheckedIndexedAccess` pero que Zod nunca deja alcanzar (`ZodError`
siempre tiene al menos un `issue`; un índice numérico en `issue.path` solo
existe si `raw` ya es el array validado) se resolvieron con una aserción no
nula comentada y justificada, en vez de perseguir el 100% con una rama
muerta.

### Qué comprueba el validador de documentación

Vive en `scripts/validateDocs.ts` y corre bajo Vitest, dentro del paso de
tests. Traduce a comprobación mecánica las reglas de `ciclo-de-spec.md` y
`consolidacion.md` que se pueden verificar sin juicio humano —**veinte
condiciones de error**, inventariadas en la cabecera del propio fichero, con
un test por cada una—:

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
| Suite E2E | Que la cobertura unitaria deje de detectar las regresiones que importan |
| Hooks de pre-commit locales | Que el ciclo de espera de CI moleste de verdad |
| El `overflow-x: auto` del carril de la cabecera (`technical/0006`) | Que la cabecera cambie de contenido —marca o destinos—, o que el desplazamiento a 320px estorbe de verdad al usarla |

El de la cabecera es el único de la tabla que no es un guardarraíl aplazado
sino un **criterio de aceptación que no se cumplió**: a 320px la marca y el
`<select>` suman 407px sobre los 320 disponibles, así que sin esa regla la
cabecera recortaría contenido. Vive aquí porque el ADR 0013 exige que todo
criterio sin marcar de una spec `closed` tenga destino escrito, y el suyo es
un aplazamiento consciente, no una deuda que alguien vaya a saldar. El
documento, en cambio, no se desplaza en horizontal a ningún ancho.

**Gates de CD (smoke tests, canary) — disparador cumplido.** El aplazamiento
tenía como condición «que exista despliegue real»; desde `technical/0001`
ese despliegue existe (GitHub Pages). Deja de ser aplazamiento y pasa a
`docs/roadmap.md` como deuda.

Un aplazamiento sin disparador es una omisión disfrazada. Un disparador que se
cumple y no se atiende es deuda: va al roadmap.

## 8. Dos tests que no se escriben aquí

No son aplazamientos —no tienen disparador porque no se quieren nunca—, sino
rechazos razonados. Se escriben porque los dos son propuestas naturales que
alguien volverá a hacer.

### El test que fija los números de salida

Pinchar la puntuación total de cada candidato y comprobar que no cambia.
Parece una red de seguridad barata.

**No lo es.** El catálogo se edita a mano y con frecuencia —los precios rotan,
se corrigen datos, entran y salen modelos—, así que el test se rompe en cada
edición **legítima**. Lo que pasa entonces es predecible: se actualizan los
números esperados sin mirar, y a la tercera vez el test ya no comprueba nada.
Ha degenerado en el ritual de actualizar los números dorados, con el coste de
un test y el valor de ninguno.

Lo que de verdad protege esas fórmulas son tests sobre **propiedades**: que un
coche en el anclaje bueno saque un 10, que la nota de un eje no cambie al
añadir otro coche al catálogo, que la curva sea en S y no una recta. Esos no
se rompen cuando el catálogo cambia, porque no dependen del catálogo.

### El test que comprueba que la lógica es la que es

Afirmar en un test que tal eje normaliza por sumando, o que tal otro combina
0,6/0,4. Es tautológico: eso es cierto porque así lo dice el código dos
líneas más arriba, y deja de serlo exactamente cuando alguien cambia el
código a propósito.

Un test así no detecta un fallo, **detecta una edición**. Y además comunica
algo falso: sugiere que quien toca el código no sabe lo que está tocando.

Cuando lo que se quiere proteger es una invariante de verdad y no una línea
concreta, la herramienta correcta es una regla ejecutable —dependency-cruiser
para las dependencias, el validador para la coherencia documental— o un test
sobre el **comportamiento observable**, no sobre la forma de la
implementación.
