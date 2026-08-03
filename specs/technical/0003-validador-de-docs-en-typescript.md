# 0003 — Validador de documentación en TypeScript

- **Id:** technical/0003
- **Estado:** draft
- **Tipo:** technical
- **Fecha:** 2026-08-03
- **Specs relacionadas:** technical/0001
- **ADRs relacionados:** 0003
- **Doc de estado:** `docs/estado/arquitectura.md`, `docs/estado/despliegue.md`

## Contexto

`scripts/validate_docs.py` comprueba las invariantes mecánicas del ciclo de
spec y de la consolidación: campos de cabecera, estados válidos, formato de
fecha, correspondencia entre `Id` y carpeta, secciones obligatorias no
vacías, criterios de aceptación presentes cuando el estado los exige,
decisiones abiertas cerradas, avisos A y B en el estado que toca, nombres de
fichero, numeración sin repetir y plantillas presentes. Son **veinte
condiciones de error** distintas.

Está en Python porque se escribió antes de que hubiera stack: su propio
docstring lo dice —«Standard library only, by design: the project has no
stack yet»—. Esa condición dejó de ser cierta con el ADR 0003 y
`technical/0001`. Hoy el proyecto es TypeScript con Vitest, y el *job*
`docs` de la CI arranca un segundo *runtime* solo para este fichero:
`actions/setup-python` con Python 3.12, junto al Node que ya usan los otros
seis pasos.

Nada de esto rompe nada hoy. Es deuda registrada desde el 2026-08-02, y su
condición de cierre —que `technical/0001` estuviera `consolidated`— se
cumplió.

El riesgo del port no es escribirlo: es **perder una regla por el camino sin
que nadie se entere**. Un validador que valida de menos sigue pasando en
verde, y el fallo solo aparece cuando un documento mal formado se cuela. Hoy
no hay un solo test del validador: su corrección descansa en haberlo leído.

## Objetivo

Que la CI arranque un único *runtime*, y que el port no pueda perder ninguna
de las veinte comprobaciones sin que un test lo cante.

## Alcance

- **Port a TypeScript** de las veinte condiciones de error, con los mismos
  criterios de aceptación o rechazo que hoy.
- **Un test por condición de error**, con documentos de fixture que la
  disparen, más los casos válidos que no deben dispararla.
- **Ejecución bajo Vitest**, de modo que `npm test` lo cubra.
- **Retirada del paso de Python** del *job* `docs` de la CI y borrado de
  `scripts/validate_docs.py`.
- **Actualización de la documentación de CI** que hoy nombra el script de
  Python.

## Fuera de alcance

- **Añadir reglas nuevas de validación.** Si el port cambia de comportamiento
  a la vez que cambia de lenguaje, deja de poder responderse la única
  pregunta que importa: ¿se ha perdido algo? Reglas nuevas, en su spec.
- **Cambiar las reglas del ciclo de spec o de la consolidación.** Aquí se
  traducen tal cual; discutirlas es cambiar `ciclo-de-spec.md`, no esto.
- **Tocar `markdownlint` o `lychee`.** Son otras herramientas del mismo
  *job* y siguen igual.
- **Meter el validador en el suelo de cobertura del 100%.** Lleva sus
  propios tests por regla; si además entra en el suelo es una decisión
  aparte.

## Requisitos / comportamiento esperado

1. El validador comprueba exactamente las mismas veinte condiciones que
   `validate_docs.py`, ni una menos.
2. Ante un repositorio válido termina sin error y dice cuántos documentos ha
   comprobado, como hoy.
3. Ante uno o más documentos inválidos falla, y cada mensaje identifica el
   fichero por su ruta relativa y la condición incumplida.
4. Cada una de las veinte condiciones tiene al menos un test que la dispara y
   otro que comprueba que un documento correcto no la dispara.
5. Los tests operan sobre documentos de fixture propios, no sobre las specs
   reales del repositorio: un test que dependa de ellas cambiaría de
   resultado cada vez que se escribe una spec.
6. Además de los fixtures, el validador se ejecuta contra las specs y ADRs
   reales del repositorio, que deben pasar.
7. La CI no arranca Python en ningún *job*.
8. El validador queda cubierto por `tsc --noEmit` y por `eslint`, como el
   resto del código TypeScript del proyecto.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Existe un inventario escrito de las veinte condiciones de error del
      validador de Python, y cada una aparece en el código nuevo.
- [ ] Cada condición tiene un test que la dispara sobre un fixture inválido y
      un test que confirma que un fixture válido no la dispara.
- [ ] Ejecutar el validador nuevo sobre las specs y ADRs reales del
      repositorio termina sin errores.
- [ ] Introducir un error deliberado en un documento real —estado
      desconocido, fecha mal formada, aviso equivocado— hace fallar el
      validador nuevo, comprobado antes de revertirlo.
- [ ] `.github/workflows/ci.yml` no contiene ninguna referencia a Python ni a
      `actions/setup-python`.
- [ ] `scripts/validate_docs.py` ya no existe en el repositorio.
- [ ] Ninguna documentación de proceso sigue nombrando
      `scripts/validate_docs.py` como la implementación vigente.
- [ ] `npm test`, `tsc --noEmit` y `eslint` cubren el validador nuevo.
- [ ] La secuencia completa de CI pasa, con el suelo de cobertura vigente
      intacto.

## Dependencias y supuestos

- Depende de `technical/0001`, que fijó el stack y la CI en la que este
  validador se ejecuta.
- Se asume que las reglas del ciclo de spec y de la consolidación no cambian
  durante el port: se traducen, no se rediscuten.
- Se asume que el suelo de cobertura sigue cubriendo `domain/`, `data/` y
  `logging/`, y que el validador nuevo no lo altera.

## Decisiones abiertas

Ninguna.
