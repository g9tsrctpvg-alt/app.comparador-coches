# Estado: infraestructura y despliegue

> Este documento es la **autoridad sobre cómo se construye, se configura y se
> despliega el sistema hoy**: entornos, variables, artefactos y pipeline. Si
> hay duda sobre cómo llega el código a un entorno, gana lo que diga este
> documento.

**Estado:** Activo.

## Artefacto

`npm run build` (`tsc --noEmit && vite build`) produce un sitio estático en
`dist/`: HTML, JS y CSS empaquetados, con el catálogo JSON embebido en el
propio bundle. No hay proceso de servidor ni artefacto más allá de esos
ficheros estáticos.

La aplicación se sirve bajo el subdirectorio del repositorio, no en la raíz
del dominio: `vite.config.ts` fija `base: '/app.comparador-coches/'`, y las
rutas de los recursos generados en `dist/index.html` ya lo incorporan.

## Entorno

Un único entorno: **GitHub Pages**, con origen `GitHub Actions` — sin rama ni
carpeta que servir a mano. No hay entorno de *staging* ni variables de
configuración por entorno: sin backend, no hay secretos ni credenciales que
gestionar en el despliegue.

## Pipeline

`.github/workflows/ci.yml`. En cada push a `main` y en cada PR corren, en
este orden, los seis pasos del suelo de CI
(`docs/proceso/ci-y-guardarrailes.md`, §4): formato y lint, tipado,
contratos de arquitectura, tests con cobertura, lint de documentación,
enlaces de documentación, y escaneo de secretos.

La **coherencia de specs y ADRs** no es un paso aparte: la comprueba
`scripts/validateDocs.ts` bajo Vitest, dentro del paso de tests. El *job*
`docs` solo ejecuta `markdownlint`. Toda la CI corre sobre un único
*runtime*, Node: desde `technical/0003` no se arranca Python en ningún
sitio.

`build` corre en todo push y PR y verifica que el sitio se construye.
`deploy` depende de `build`, solo se ejecuta en push a `main`, y publica
`dist/` a GitHub Pages con `actions/upload-pages-artifact` y
`actions/deploy-pages`.

## Qué falta

`service.version` y `deployment.environment` —campos del `Resource` descritos
en `docs/proceso/logging.md`— no están cableados todavía: no hay esquema de
versión de release ni más de un entorno. Registrado como deuda en
`docs/roadmap.md`.

## Aplazamientos vigentes

Ninguno propio de este documento. El aplazamiento de los gates de CD —*smoke
tests*, *canary*— tenía como disparador «que exista despliegue real», y ese
despliegue ya existe: la condición está cumplida, y el seguimiento pasa a
`docs/roadmap.md` como deuda, no como aplazamiento — ver
`docs/proceso/ci-y-guardarrailes.md`, §7.
