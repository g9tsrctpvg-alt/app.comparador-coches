# Estado: arquitectura

> Este documento es la **autoridad sobre cómo está construido el sistema
> hoy**: estructura de capas, límites entre módulos, dirección de las
> dependencias y punto de arranque. Si hay duda entre dos formas de
> estructurar algo, gana lo que diga este documento, no la preferencia del
> agente ni el precedente más cercano en el código.

**Estado:** Pendiente — no hay sistema que describir.

## Situación actual

El repositorio contiene la base documental y la CI de gates documentales. **No
existe código de producción, ni stack decidido, ni estructura de módulos.**

Este documento no describe nada todavía porque no hay nada que describir.
Declararlo es preferible a rellenarlo con la arquitectura que se supone que
tendrá: un doc de estado que anticipa es indistinguible de uno que miente.

## Qué lo desbloquea

La decisión de stack (🟡), que se registrará como ADR y llegará acompañada de
la spec técnica que introduzca la primera estructura. Al consolidarse esa
spec, este documento pasa a describir en presente:

- Lenguaje, framework y gestor de dependencias.
- Si el repositorio es monorepo o app única, y en su caso el reparto por app.
- Capas y dirección de dependencias, con la regla ejecutable que las impone.
- Puertos declarados por el dominio y dónde se implementan.
- Punto único de *wiring* y arranque.

Seguimiento en `docs/roadmap.md`.

## Reglas ya vigentes

Aunque no haya código, dos reglas de `docs/proceso/estilo.md` ya condicionan
cualquier arquitectura que se proponga, y no están abiertas a debate en la
primera spec técnica:

- **Las dependencias apuntan hacia dentro**, y la regla es **ejecutable en
  CI**. El núcleo de dominio no conoce framework ni capas externas; lo que
  necesita de fuera lo declara como **puerto**.
- **El *wiring* vive en un único punto de arranque.**
