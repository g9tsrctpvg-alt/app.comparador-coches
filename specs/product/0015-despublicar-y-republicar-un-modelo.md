# 0015 — Despublicar y republicar un modelo

- **Id:** product/0015
- **Estado:** approved
- **Tipo:** product
- **Fecha:** 2026-08-07
- **Specs relacionadas:** product/0001, product/0014
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

## Contexto

Hoy la única forma de sacar un coche de la comparativa es borrar su entrada
de `src/data/cars.json`. Eso se lleva por delante todo lo que costó
reunir —las diecinueve magnitudes con su fuente, las notas, las fotos
verificadas de `product/0014`— y no es reversible más que reescribiéndolo
todo desde cero. Un coche puede dejar de interesar por motivos que no
tienen nada que ver con la calidad de sus datos: se descataloga, sube de
precio y sale de presupuesto, o simplemente el usuario decide que ya no
quiere seguir comparándolo hoy, pero podría volver a hacerlo mañana.

El catálogo no distingue hoy entre «este coche no es un candidato» y «este
coche no existe en la investigación». Son dos cosas distintas y el formato
actual solo sabe representar la segunda.

## Objetivo

Que un coche pueda salir de la comparativa —del ranking, de la ficha
técnica, de la ficha completa y de la página que explica los cálculos— sin
perder ninguno de sus datos, y pueda volver a entrar exactamente como
estaba.

## Alcance

- Un campo `published` en `CarSchema`, booleano, opcional con valor por
  defecto `true`: un coche sin el campo escrito sigue publicado, igual que
  hoy.
- Un punto único en el dominio que separa «todos los coches del fichero» de
  «los candidatos activos hoy» (los publicados), para que ningún consumidor
  tenga que acordarse de filtrar por su cuenta.
- Aplicar ese filtro antes de que el catálogo llegue a cualquier sitio que
  lo use: el ranking y su puntuación, la ficha técnica, la ficha completa,
  la página de explicación, y la validación de la configuración persistente
  y compartible (`product/0012`).
- El caso límite de que **todos** los coches queden despublicados: se trata
  igual que un catálogo vacío hoy —mensaje de error legible, no un fallo
  general de la aplicación—, reutilizando el camino que ya existe para eso.
- Dos skills de Claude Code, `.claude/skills/unpublish-model/` y
  `.claude/skills/republish-model/`, que cambian el campo para un coche que
  ya está en el catálogo y dejan una nota fechada explicando el porqué.

## Fuera de alcance

- **Borrar nada.** Despublicar nunca toca fuentes, fotos, notas ni ninguna
  otra magnitud del coche. Es un interruptor, no una papelera.
- **Estados intermedios o motivos tipificados.** Es un booleano. El motivo,
  si hace falta explicarlo, va en `notes` como texto libre, que es el
  mecanismo que el catálogo ya tiene para eso.
- **Un botón en la interfaz web.** Publicar y despublicar es una decisión
  de quien mantiene el catálogo, no una función de la aplicación que ve
  quien la usa para comparar. Se hace desde el repositorio, con las dos
  skills.
- **Tocar `references.json`.** La referencia (`product/0013`) no es un
  candidato y no entra en este mecanismo.
- **Cambiar cómo se puntúa un coche publicado.** El ADR 0004 ya fija que
  cada eje se puntúa contra una escala absoluta, no contra el conjunto de
  candidatos: la nota de un coche publicado no depende de qué otros estén
  publicados hoy, y esta spec no toca esa invariante, solo la hereda.
- **Cambiar qué pasa con un peso o valoración guardados para un coche que
  se despublica.** `validCarIds` ya ignora cualquier id que no esté en el
  catálogo cargado (`product/0012`); un id despublicado deja de estar ahí
  y su override guardado deja de aplicar, con el mismo mecanismo que ya
  existe hoy para un id que ya no está en el fichero.

## Requisitos / comportamiento esperado

1. **`CarSchema` declara `published: z.boolean().default(true)`.** Un
   registro que no lo escribe sigue publicado — ningún coche del catálogo
   actual cambia de estado al añadir el campo.
2. **`loadCatalog()` no filtra.** Sigue devolviendo y validando **todos**
   los coches del fichero, publicados o no: un coche oculto sigue siendo
   un dato real del catálogo, y un error en sus datos se sigue detectando
   igual que hoy.
3. **Una función de dominio nueva separa candidatos de publicados**, por
   ejemplo `publishedCars(cars: Car[]): Car[]` en `src/domain/car.ts`. No
   hace ningún cálculo, solo filtra por el campo — no hay razón para que
   viva en `domain/scoring/` ni para que la regla de arquitectura
   `ui-no-scoring-internals` la alcance.
4. **`src/ui/App.tsx` aplica el filtro en el único punto donde carga el
   catálogo**, antes de repartir el resultado a `scoreCatalog`, a
   `FichaTecnicaPage`, `FichaCompletaPage`, `ExplicacionPage`, y a
   `validCarIds`. Ningún componente vuelve a comprobar `published` por su
   cuenta — si hiciera falta, sería la señal de que el filtro se ha puesto
   en el sitio equivocado.
5. **Catálogo real sin candidatos publicados = catálogo vacío.** Si tras
   filtrar no queda ningún coche, `App` muestra el mismo mensaje que ya
   muestra hoy cuando `cars.json` está vacío o no se puede cargar, no una
   pantalla en blanco ni una excepción sin capturar.
6. **Las dos skills**, en `.claude/skills/unpublish-model/` y
   `.claude/skills/republish-model/`:
   - reciben qué coche (id o nombre reconocible) hay que publicar o
     despublicar;
   - cambian `published` a `false` o `true` respectivamente;
   - añaden una nota fechada a `notes` explicando el cambio —piden el
     motivo si no se ha dado, no lo inventan—;
   - corren la misma secuencia de CI local que ya exige `add-model` antes
     de comitear;
   - comitean como `data(web): unpublish <marca> <modelo>` o
     `data(web): republish <marca> <modelo>`, en inglés, en su propia rama;
   - no empujan ni abren PR salvo que se les pida explícitamente en esa
     conversación.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `CarSchema` acepta un registro sin `published` y lo trata como
      publicado (test).
- [ ] `CarSchema` acepta `published: false` explícito (test).
- [ ] La función de filtrado deja fuera exactamente los coches con
      `published: false`, conservando el orden del resto (test, con casos:
      ninguno oculto, alguno oculto, todos ocultos).
- [ ] Un coche despublicado no aparece en el ranking, en la ficha técnica,
      en la ficha completa ni en la página de explicación (test de
      integración en `App.test.tsx`, con un catálogo fixture donde un
      coche lleva `published: false`).
- [ ] Con todo el catálogo despublicado, la aplicación muestra el mensaje
      de catálogo vacío/no cargado, sin lanzar una excepción no capturada
      (test).
- [ ] `scoreCatalog.snapshot.test.ts` y el conteo de
      `loadCatalog.test.ts` no cambian: el catálogo real de hoy no tiene
      ningún coche despublicado.
- [ ] Las dos skills existen y, ejecutadas sobre un coche real del
      catálogo, producen un commit que pasa la CI local entera
      (`format:check`, `lint`, `typecheck`, `arch:check`,
      `test:coverage` al 100 %).
- [ ] La CI entera pasa en local.

## Dependencias y supuestos

- Depende del formato de `Car` que fija `product/0001` (`consolidated`).
- Supone que publicar y despublicar es una acción de quien mantiene el
  catálogo —hoy, el propio usuario, a través de las skills—, no una
  función que se expone en la aplicación desplegada.
- El campo se añade a `Car`, no a `Reference`: no hay hoy ningún caso de
  uso para despublicar la fila de referencia.

## Decisiones abiertas

Ninguna.
