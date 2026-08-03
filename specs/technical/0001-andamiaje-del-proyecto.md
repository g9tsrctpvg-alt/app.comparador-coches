# 0001 — Andamiaje del proyecto y gates de código

- **Id:** technical/0001
- **Estado:** verified
- **Tipo:** technical
- **Fecha:** 2026-08-02
- **Specs relacionadas:** product/0001
- **ADRs relacionados:** 0001, 0003
- **Doc de estado:** `docs/estado/arquitectura.md`, `docs/estado/despliegue.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El repositorio tiene base documental, plantillas y una CI que hoy solo cubre
documentación: validación de specs y ADRs, lint de Markdown, comprobación de
enlaces y escaneo de secretos. Los cuatro primeros pasos del suelo de CI
—formato, tipado, contratos de arquitectura y tests— están declarados
`Pendiente` porque no había stack con el que instanciarlos.

No existe código de producción, ni proyecto que construir, ni despliegue. El
comparador vive fuera del repositorio, como artefacto React de un solo fichero
con estilos en línea.

El ADR 0003 ha resuelto el stack. Esta spec lo materializa: sin proyecto no
hay dónde implementar `product/0001`, y sin gates de código el primer código
nacería sin proteger, que es exactamente lo que el proceso quiere evitar.

## Objetivo

Dejar el proyecto construible, verificable y desplegable, con los gates de
código activos **antes** de que exista lógica de negocio.

## Alcance

- Proyecto Vite con React y TypeScript en modo estricto, gestionado con npm.
- Estructura `src/domain/`, `src/data/`, `src/ui/` y `src/main.tsx` como único
  punto de *wiring*.
- Regla de dependencias ejecutable: `domain/` no importa de `ui/`, de React ni
  del DOM.
- Validación del catálogo JSON con Zod en la carga.
- Vitest con cobertura, y suelo de cobertura fijado por *ratcheting*.
- Prettier y ESLint en modo comprobación, integrados en CI.
- Logger de navegador con la forma de campos del ADR 0001 y su addendum.
- Despliegue a GitHub Pages desde GitHub Actions.
- Actualización de la secuencia de CI documentada y de Dependabot.

## Fuera de alcance

- **Las fórmulas de puntuación y el desglose por ejes**: son `product/0001`.
- **El contenido del catálogo.** Esta spec fija que se valida y cómo se carga,
  no qué coches contiene ni con qué valores.
- **La migración del artefacto React existente** y su diseño responsive.
- **Persistencia en `localStorage` y configuración compartida por URL.**
- **Suite E2E**, aplazada con su disparador.

## Requisitos / comportamiento esperado

1. `npm install` y `npm run build` producen un sitio estático sin errores
   partiendo de un clon limpio.
2. TypeScript corre en modo estricto. Cualquier `any` o supresión de error
   lleva comentario que justifique por qué.
3. `domain/` no importa de `ui/`, de React ni de APIs del navegador. La
   violación de esa regla hace fallar la CI, no una revisión.
4. El catálogo se carga desde JSON y se valida contra un esquema Zod; los
   tipos de dominio se derivan de esa misma declaración.
5. Un catálogo que no valida detiene el arranque con un error que identifica
   el campo y el registro.
6. Vitest ejecuta los tests con informe de cobertura, y la CI falla si la
   cobertura baja del suelo vigente.
7. Prettier y ESLint corren en modo comprobación: fallan, no reformatean.
8. El logger de navegador emite `Timestamp`, `SeverityText`, `Body`,
   `Attributes` y `Resource` con `service.name` igual a
   `comparador-coches-web`, solo para errores. No hay escritura directa a
   consola fuera del logger.
9. Un push a la rama principal despliega el sitio construido a GitHub Pages.
10. El sitio se sirve bajo el subdirectorio del repositorio, no en la raíz del
    dominio: la ruta base de Vite lo refleja y las rutas de los recursos
    resuelven en la URL publicada, no solo en local.
11. La secuencia de CI documentada coincide con la que ejecuta el workflow.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Desde un clon limpio, `npm ci` seguido de `npm run build` termina sin
      errores y genera el artefacto estático.
- [x] `npm run typecheck` pasa con `strict` activado y sin supresiones sin
      justificar.
- [x] Un import de prueba desde `src/domain/` hacia `src/ui/` o hacia `react`
      hace fallar el paso de contratos de arquitectura en CI.
- [x] Un `cars.json` con un campo de tipo incorrecto hace fallar la carga con
      un error que nombra el campo y el registro afectados.
- [x] `npm test` ejecuta la suite con cobertura y falla si esta baja del suelo
      declarado.
- [x] Un fichero con formato incorrecto hace fallar el paso de formato sin
      modificar el fichero.
- [x] El workflow de CI ejecuta, en orden: formato y lint, tipado, contratos
      de arquitectura, tests con cobertura, gates documentales y escaneo de
      secretos.
- [x] Un push a la rama principal deja el sitio accesible en su URL de GitHub
      Pages.
- [x] En esa URL publicada la aplicación carga sus recursos sin errores 404,
      con el sitio servido bajo el subdirectorio del repositorio.
- [x] `docs/proceso/ci-y-guardarrailes.md` documenta la secuencia exacta y
      coincide con la del workflow.
- [x] Dependabot cubre `npm` además de `github-actions`.

## Dependencias y supuestos

- Depende del ADR 0003, que fija stack, estructura y despliegue, y del
  addendum al ADR 0001 para la forma del logger de navegador.
- Se asume que GitHub Pages está disponible para el repositorio y que
  habilitarlo es una acción de administración externa a esta spec.
- Se asume que el suelo de cobertura inicial se fija al valor que alcance la
  suite en su primera ejecución verde, y que a partir de ahí solo sube.

## Decisiones abiertas

Ninguna.
