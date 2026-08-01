# Normas de estilo

> Este documento manda sobre **estilo de código, de documentación y de
> trabajo**. Las reglas de formato mecánico las impone la herramienta, no este
> documento; aquí está lo que la herramienta no puede comprobar.

## 1. Estilo de código

- **El formato no se discute: lo impone la herramienta**, y la CI comprueba
  que esté aplicado. Cero debate de estilo en revisión.
- **Tipado estático en modo estricto**, sin escapes silenciosos. Un `any` o un
  `ignore` lleva comentario justificando por qué.
- **Las dependencias apuntan hacia dentro** y la regla es **ejecutable en
  CI**. El núcleo de dominio no conoce framework ni capas externas; lo que
  necesita de fuera lo declara como **puerto** que implementa la capa de
  infraestructura. El *wiring* vive en un único punto de arranque.
- **Duplicar en el núcleo antes que acoplarlo hacia fuera** es la decisión
  correcta cuando el dominio necesita algo que ya existe en una capa externa.
- **Decisiones de estilo transversales se toman una vez y se registran** —por
  ejemplo, síncrono vs asíncrono—: no se introducen «a medias». Si algún día
  se justifica cambiarlas, será un cambio deliberado con ADR.
- **Sin dependencias nuevas salvo decisión explícita 🟡.** Añadir una librería
  es una decisión de arquitectura, no un detalle de implementación.
- **Si copias la misma construcción dos o más veces, extrae un primitivo.** La
  coherencia de una interfaz de usuario vive en sus primitivos compartidos, no
  en la disciplina de quien la escribe.
- **Lo generado no se edita a mano.** Se regenera con su comando y se commitea
  junto al cambio que lo motiva.

Las herramientas concretas —formateador, comprobador de tipos, verificador de
contratos de arquitectura— dependen del stack y están pendientes. Ver
`docs/roadmap.md`.

## 2. Estilo de documentación

- **Escribe para un agente sin memoria.** Nada de «como se comentó antes» ni
  referencias implícitas a decisiones no enlazadas.
- **Un dato vive en un solo sitio.** El resto **enlaza**, no copia. La
  duplicación documental se desincroniza siempre.
- **Presente para el estado, pasado para el registro.** Los docs de estado
  describen el sistema en presente y sin rastro del cambio que los produjo;
  las specs son históricas por diseño.
- **Tablas para lo enumerable, prosa para el porqué.** Cada tabla y cada
  documento empiezan diciendo de qué mandan.
- **Ancho de línea ~80 columnas** y encabezados que se puedan enlazar. La
  documentación se lee tanto en diff como renderizada.
- **Etiquetas de estado neutras** para documentos —`Pendiente` · `Base` ·
  `Definido` · `Activo`—; 🟢/🟡/🔴 **solo** para autonomía.
- **Marca lo pendiente como pendiente**, con el disparador que lo desbloquea.
  Un documento que finge estar completo es peor que uno que declara su hueco.

## 3. Estilo de trabajo

- **Antes de tocar código, lee el doc de estado del área.** No reconstruyas el
  estado leyendo specs.
- **Antes de dar algo por hecho, pasa la secuencia de CI entera** en local.
  «Funciona en mi máquina» no es un estado del ciclo de vida.
- **Para cambios visuales, míralos renderizados** en los tamaños que importan.
  Los tests unitarios no ven el layout.
- **Termina lo que abres.** Una spec implementada y sin consolidar es trabajo
  a medias, y el roadmap lo debe reflejar como tal.
