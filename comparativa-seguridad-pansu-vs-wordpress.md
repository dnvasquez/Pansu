# Comparativa de Seguridad y Prestaciones

## Sitio PANSU vs sitio web en WordPress

**Fecha:** 2 de mayo de 2026  
**Alcance:** comparación entre el sitio actual del proyecto PANSU y un sitio web típico implementado en WordPress.

## 1. Nota metodológica

Esta comparativa se basa en el sitio local del proyecto PANSU y en las características habituales de un sitio web en WordPress autogestionado.

Como no se dispone aquí del WordPress específico, se asume un escenario estándar con:

- Tema visual de terceros o personalizado.
- Uno o varios plugins para formularios, SEO, seguridad y caché.
- Panel de administración WordPress clásico.
- Base de datos MySQL.
- Edición de contenido desde el backend de WordPress.

Si después compartes el sitio WordPress concreto, la comparativa se puede ajustar con mucha más precisión.

## 2. Resumen ejecutivo

El sitio PANSU tiene una arquitectura más simple y más controlada que un WordPress típico. Eso le da ventajas claras en:

- superficie de ataque más pequeña,
- control fino sobre sesiones y rutas,
- menor dependencia de plugins,
- mejor previsibilidad del backend.

WordPress, en cambio, suele ofrecer mejores prestaciones de gestión editorial, escalabilidad funcional y ecosistema de plugins, pero a cambio introduce:

- más dependencias,
- más vectores de ataque,
- mayor complejidad de mantenimiento,
- más exposición si no se endurece correctamente.

En términos generales:

- **Seguridad base:** PANSU puede quedar mejor parado que un WordPress promedio mal administrado.
- **Prestaciones de administración:** WordPress suele ganar por facilidad de uso y amplitud funcional.
- **Mantenimiento y expansión:** WordPress gana en velocidad de crecimiento funcional.
- **Control y ligereza:** PANSU gana por simplicidad y control técnico.

## 3. Comparativa general

| Criterio | Sitio PANSU | WordPress típico |
|---|---|---|
| Superficie de ataque | Más reducida | Más amplia |
| Control del backend | Alto, a medida | Alto, pero dependiente de CMS y plugins |
| Dependencia de terceros | Media | Alta |
| Facilidad de edición | Buena, pero específica | Muy alta |
| Curva de administración | Media | Baja |
| Rendimiento base | Ligero | Puede ser más pesado |
| Escalabilidad funcional | Media | Alta |
| Seguridad por defecto | Intermedia | Variable, muchas veces baja si no se endurece |
| Mantenimiento | Más controlado | Más frecuente |
| Riesgo por plugins | Bajo | Alto |

## 4. Seguridad

### 4.1 Sitio PANSU

El sitio ya incorpora varios elementos positivos:

- cabeceras de seguridad,
- cookies de sesión `HttpOnly` y `SameSite`,
- protección de rutas privadas,
- validación de formularios,
- rate limiting,
- separación entre sitio público y panel administrativo.

Esto lo convierte en una solución bastante contenida y predecible. El principal punto débil actual es la ausencia de una `Content-Security-Policy` fuerte, el uso de dependencias externas y la falta de algunas capas de defensa como CSRF explícito, auditoría y política de privacidad visible.

### 4.2 WordPress típico

WordPress puede ser seguro, pero su seguridad real depende mucho de cómo se implemente:

- núcleo actualizado,
- plugins actualizados,
- tema confiable,
- credenciales fuertes,
- MFA,
- hardening del servidor,
- WAF,
- backups y monitoreo.

El problema es que, en la práctica, muchos sitios WordPress acumulan plugins, plantillas y personalizaciones que aumentan la superficie de ataque. Los riesgos más comunes suelen ser:

- plugins vulnerables,
- temas desactualizados,
- accesos de administrador demasiado amplios,
- formularios expuestos a spam,
- configuraciones débiles de caché y permisos,
- ataques de fuerza bruta en `wp-login.php`,
- exposición del XML-RPC si no se controla.

### 4.3 Conclusión de seguridad

Si comparamos un **PANSU bien administrado** contra un **WordPress promedio**, PANSU puede ser más seguro por diseño, especialmente por ser más simple y tener menos piezas móviles.

Si comparamos PANSU contra un **WordPress muy bien mantenido y endurecido**, la diferencia se reduce y WordPress puede igualar o superar en seguridad operativa si se administran bien sus controles.

## 5. Prestaciones

### 5.1 Sitio PANSU

PANSU destaca por:

- diseño orientado a conversión,
- calculadora de ahorro propia,
- formulario de cotización,
- bloques comerciales bien definidos,
- panel de administración adaptado al negocio,
- carga ligera en comparación con un CMS tradicional más pesado.

Ventajas prácticas:

- experiencia más directa,
- menos complejidad técnica,
- cambios de contenido muy enfocados al negocio,
- mejor control sobre la presentación.

Limitaciones:

- menos flexibilidad para publicar tipos de contenido complejos sin desarrollo adicional,
- menos ecosistema de extensiones listas para usar,
- más dependencia del equipo técnico si se quieren cambios estructurales.

### 5.2 WordPress típico

WordPress suele ganar en:

- gestión de contenidos para usuarios no técnicos,
- edición visual,
- plugins para formularios, SEO, analytics, e-commerce, reservas, multidioma y membresías,
- rapidez para crear nuevas secciones,
- escalabilidad de funcionalidades sin desarrollar todo desde cero.

Pero esa misma ventaja implica más peso técnico:

- más scripts,
- más consultas,
- más mantenimiento,
- más probabilidad de conflictos entre plugins,
- más riesgo de degradación de rendimiento.

### 5.3 Conclusión de prestaciones

Si el objetivo principal es una **landing comercial ágil, específica y controlada**, el sitio PANSU está mejor alineado.

Si el objetivo principal es un **portal editorial grande, con muchas páginas, blog, plugins, comercio electrónico o gestión autónoma por parte de varios usuarios**, WordPress suele ser más conveniente.

## 6. Gestión de contenido

### PANSU

El sitio PANSU tiene un CMS propio enfocado en las secciones que realmente necesita el negocio. Eso evita sobrecargar la administración con elementos innecesarios.

Ventajas:

- menos distracciones,
- mayor simplicidad,
- menos posibilidades de error al editar,
- lógica hecha a medida.

Desventajas:

- depende del desarrollo interno,
- requiere documentación propia,
- no ofrece de serie el ecosistema de WordPress.

### WordPress

WordPress ofrece una administración más familiar y flexible para usuarios no técnicos.

Ventajas:

- panel conocido,
- editor visual,
- enorme ecosistema,
- curva de aprendizaje baja para contenido básico.

Desventajas:

- la experiencia depende mucho del tema y de los plugins,
- puede volverse compleja con el tiempo,
- la administración no siempre es consistente entre plugins.

## 7. Mantenimiento

### PANSU

El mantenimiento se concentra en:

- backend propio,
- dependencias limitadas,
- control sobre el servidor,
- contenido del sistema.

Esto facilita entender qué está pasando, pero exige disciplina para documentar y evolucionar el código.

### WordPress

WordPress requiere mantenimiento más constante:

- actualizaciones del núcleo,
- actualizaciones de plugins,
- actualizaciones de temas,
- limpieza de extensiones inactivas,
- revisión de seguridad frecuente.

Si no se cuida, la deuda técnica crece rápido.

## 8. Recomendación estratégica

### Si el sitio seguirá siendo una landing corporativa

Conviene seguir con la línea de PANSU, porque:

- es más simple,
- más controlable,
- más rápida,
- y menos expuesta a problemas de plugins.

### Si el sitio va a crecer mucho en contenido y funcionalidades

Conviene considerar WordPress, pero solo si se implementa con disciplina:

- pocos plugins y muy seleccionados,
- MFA obligatoria,
- hardening,
- backups,
- monitoreo,
- roles bien definidos,
- auditoría de actividad.

## 9. Veredicto final

Para el caso de este proyecto, el sitio PANSU es una solución **más limpia, ligera y controlable** que un WordPress típico.

WordPress gana cuando la necesidad principal es la **flexibilidad editorial y la expansión funcional**.

PANSU gana cuando la necesidad principal es la **seguridad práctica, el rendimiento y el control del flujo comercial**.

## 10. Conclusión

Si la comparación se hace contra un WordPress promedio, el sitio PANSU tiene una postura técnica bastante competitiva e incluso más favorable en seguridad estructural. WordPress solo superará claramente a este enfoque cuando se necesite mucha autonomía de edición y una batería amplia de funcionalidades listas para usar.

En resumen:

- **Seguridad:** ventaja para PANSU en simplicidad; ventaja para WordPress solo si está muy bien endurecido.
- **Prestaciones comerciales:** empate técnico, con ventaja para PANSU en una landing enfocada.
- **Prestaciones de gestión de contenidos:** ventaja para WordPress.
- **Mantenimiento:** ventaja para PANSU si el alcance es acotado.

