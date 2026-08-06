# 0003 — Stack: SPA estática con Vite, React y TypeScript

- **Estado:** approved
- **Fecha:** 2026-08-02
- **Nivel:** 🟡

## Contexto

El producto es un comparador de once candidatos sobre seis ejes de
puntuación, con deslizadores de peso y recálculo en vivo. El cálculo es
aritmética elemental; lo que condiciona la elección técnica es otra cosa:

- **No hay nada que servir.** Ni autenticación, ni datos de terceros, ni
  escritura, ni PII. Un backend sería peso muerto y superficie de ataque a
  cambio de nada.
- **La interfaz es enteramente interactiva.** No existe una parte estática
  que pudiera renderizarse aparte y ahorrar JavaScript.
- **Las fórmulas son el producto.** Las cinco correcciones metodológicas del
  proceso de decisión fueron todas de cálculo. Ahí es donde tienen que estar
  los tests, y para eso las fórmulas no pueden vivir dentro de componentes.
- **Ya existe un artefacto React funcionando**, de un solo fichero y sin más
  dependencia que React.
- **El catálogo se edita a mano y con frecuencia**: los precios rotan rápido y
  se reconfirman cada pocos meses.

## Decisión

**Aplicación única** (no monorepo), estática, sin backend.

| Pieza | Elección |
| --- | --- |
| Build | Vite |
| Interfaz | React + TypeScript en modo estricto |
| Lógica de puntuación | TypeScript puro, sin framework |
| Datos | JSON en el repositorio, validado en carga con Zod |
| Tests | Vitest con cobertura v8 |
| Formato y lint | Prettier + ESLint, en modo comprobación |
| Contrato de arquitectura | dependency-cruiser |
| Gestor de dependencias | npm |
| Despliegue | GitHub Pages desde GitHub Actions |

**Estructura y regla de dependencias.** El núcleo vive en `src/domain/` y no
conoce React ni el DOM; `src/ui/` puede importar de `domain/`, nunca al revés.
`src/main.tsx` es el único punto de *wiring*. La regla la impone
dependency-cruiser en CI, no la buena voluntad.

**El núcleo devuelve desgloses, no escalares.** Cada eje expone los datos de
entrada con su fuente, los supuestos aplicados, los pasos intermedios, el
valor crudo, la normalización con sus extremos identificados, las
penalizaciones aplicadas y el peso. La puntuación es un campo de esa
estructura, no su valor de retorno. La interfaz renderiza; no calcula.

**Estado del visitante.** Los ficheros JSON son de solo lectura desde el
navegador: sirven para el catálogo, no para lo que ajusta el visitante. Los
pesos, notas estéticas y supuestos van a `localStorage` para persistir entre
sesiones y a la URL para poder compartir una configuración. Si la URL trae
configuración, gana sobre `localStorage`.

**Alcance del ADR 0001.** Ese ADR fijaba un formato de log con `stdout`,
`TraceId` por petición y middleware, que no es instanciable en un navegador.
Queda acotado al código con runtime de servidor; en navegador se emite la
misma forma de campos a `console`, solo para errores. El ADR 0001 recoge esa
acotación en su decisión, con la entrada correspondiente en su historial.
`service.name` queda fijado a `comparador-coches-web`.

## Alternativas consideradas

- **Next.js.** Renderizado en servidor, enrutado y *server components* que
  este producto no usa. Descartada: incluso con exportación estática arrastra
  todo el andamiaje, y añade un modelo mental de fronteras servidor/cliente
  para una página que no tiene servidor.
- **Astro.** Su ventaja es enviar poco JavaScript hidratando solo islas.
  Descartada porque aquí la isla sería la página entera: la ventaja se anula y
  queda el coste de un segundo modelo mental sobre React.
- **Sin framework, TypeScript y DOM directo.** Cero dependencias de interfaz.
  Descartada por dos costes concretos: obliga a reescribir desde cero el
  artefacto que ya funciona, y a reimplementar a mano la reactividad de una
  pantalla con una docena de deslizadores que recalculan en vivo.
- **Añadir un backend, aunque fuese mínimo.** Permitiría guardar
  configuraciones en servidor. Descartada: `localStorage` más URL resuelven el
  caso de uso real sin introducir despliegue, credenciales ni datos personales
  bajo custodia.
- **Validar el JSON con *type guards* escritos a mano**, sin Zod. Evita una
  dependencia. Descartada porque el catálogo se edita a mano y con frecuencia:
  Zod valida y deriva los tipos desde una única declaración, de forma que un
  dato mal tecleado falla al cargar y no a mitad de un ranking. Escribir eso a
  mano es el mismo trabajo, peor mantenido y sin tipos derivados.
- **pnpm en vez de npm.** Ventajas reales en monorepos con muchos paquetes.
  Descartada: con una sola aplicación no aporta y añade una herramienta más
  que instalar.
- **Cloudflare Pages o Netlify.** Descartadas por ahora frente a GitHub Pages,
  que no exige cuenta ni proveedor nuevo. **Disparador** para reconsiderarlo:
  necesitar dominio propio, cabeceras a medida o redirecciones.

## Consecuencias

- Los parámetros `Stack` y `Nombre de servicio en logs` del índice quedan
  definidos, y con ellos se desbloquean los gates de código de CI: Prettier y
  ESLint en modo comprobación, `tsc --noEmit` estricto, dependency-cruiser y
  Vitest con suelo de cobertura.
- El artefacto React existente se migra, no se reescribe: las fórmulas salen
  de los componentes hacia `src/domain/` y ahí adquieren tests.
- **Coste asumido:** exponer desgloses en vez de números hace el tipo de
  retorno del núcleo más ancho y más caro de cambiar. Es deliberado: es el
  contrato que impide que la interfaz recalcule por su cuenta.
- **Coste asumido:** una dependencia de validación (Zod) que no existiría si
  el catálogo fuese generado en vez de escrito a mano.
- Sin backend no hay credenciales, ni secretos en despliegue, ni datos
  personales. El escaneo de secretos de CI sigue teniendo sentido; la
  disciplina de redacción de logs pasa a ser casi vacía por falta de datos que
  redactar.
- **Aplazado:** cualquier persistencia en servidor. **Disparador:** que haga
  falta compartir estado entre dispositivos sin pasar por la URL.
- **Aplazado:** *pre-rendering* o mejora del posicionamiento. **Disparador:**
  que el comparador deje de ser de uso personal y se quiera indexar.

## Historial

- **2026-08-02** — ADR creado.
- **2026-08-06** — Reescrita la mención al ADR 0001: decía que aquel «recibe
  un addendum fechado que lo remite aquí», y desde el ADR 0005 los ADR no
  llevan addenda. La acotación es la misma; solo cambia dónde vive.
