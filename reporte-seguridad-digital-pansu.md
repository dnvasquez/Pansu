# Reporte de Seguridad Digital

## Sitio web PANSU

**Fecha:** 2 de mayo de 2026  
**Alcance:** sitio público, formulario de cotización, panel de administración y servidor local/producción.

## 1. Resumen ejecutivo

El sitio analizado corresponde a una **web corporativa/comercial de generación de prospectos** para una empresa de paneles solares. Su objetivo principal es presentar servicios, reforzar confianza comercial y capturar solicitudes de cotización. Además, incorpora un **CMS o panel administrativo** para actualizar contenidos del sitio.

Desde el punto de vista de seguridad, el proyecto muestra una base aceptable para una web pequeña o mediana: ya incluye autenticación, control de acceso al área administrativa, rate limiting básico, validación de datos y algunas cabeceras de seguridad. Sin embargo, todavía presenta oportunidades claras de mejora, sobre todo en **política de contenidos, protección de formularios, seguridad del panel admin y tratamiento de datos personales**.

## 2. Caracterización del sitio

### 2.1 Tipo de sitio

Se trata de un sitio web corporativo orientado a conversión, con enfoque en:

- Presentación de marca.
- Oferta de servicios y soluciones solares.
- Captura de leads mediante formulario de cotización.
- Información de contacto y ubicación.
- Administración de contenidos desde un backend privado.

### 2.2 Funcionalidades visibles

El sitio público incluye:

- Hero principal con mensaje comercial.
- Sección “Quiénes somos”.
- Bloque de beneficios.
- Indicadores o KPIs.
- Calculadora de ahorro.
- Catálogo de servicios destacados.
- Preguntas frecuentes.
- Sección de contacto con mapa.
- Formulario de solicitud de cotización.

### 2.3 Datos que maneja

El formulario de cotización recopila:

- Nombre y apellidos.
- Región.
- Comuna.
- Correo electrónico.
- Teléfono.
- Tipo de solicitud.

Estos datos son sensibles desde la perspectiva operativa y de privacidad, porque corresponden a información personal de potenciales clientes.

## 3. Alcance técnico revisado

Se revisaron principalmente:

- [index.html](index.html)
- [login.html](login.html)
- [admin.html](admin.html)
- [_headers](_headers)
- [netlify.toml](netlify.toml)
- [server.js](server.js)
- [js/cms-client.js](js/cms-client.js)
- [js/admin-auth.js](js/admin-auth.js)

## 4. Controles de seguridad existentes

### 4.1 Cabeceras de seguridad

El servidor ya aplica varias cabeceras importantes:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security` cuando la petición llega por HTTPS

Esto está implementado en [server.js](server.js#L47) y reforzado en [_headers](_headers).

### 4.2 Control de acceso al panel

Las rutas administrativas se protegen con sesión. Si no existe una sesión válida, el servidor redirige al login. Este control se observa en [server.js](server.js#L588).

### 4.3 Gestión de sesión

La sesión usa cookie con:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` en contexto HTTPS
- expiración definida

Esto reduce el riesgo de robo de sesión por JavaScript y mitiga parte del riesgo CSRF.

### 4.4 Limitación de intentos

Hay rate limiting básico para:

- intentos de login
- envío de cotizaciones

Esto ayuda a frenar abuso automatizado y fuerza bruta.

### 4.5 Validación de entradas

El backend valida campos obligatorios y correo electrónico antes de procesar la solicitud de cotización. También valida la configuración de destino y regiones habilitadas.

## 5. Hallazgos de seguridad

### Hallazgo 1: Falta una Content Security Policy

No se detectó una `Content-Security-Policy` en las cabeceras de seguridad. Esto deja más expuesto al sitio frente a inyección de scripts, abuso de recursos de terceros y cargas no autorizadas.

**Riesgo:** medio-alto  
**Impacto:** aumento de superficie para XSS y dependencia insegura de terceros.

### Hallazgo 2: Dependencia de recursos externos

El sitio carga bibliotecas y servicios externos como Bootstrap, Google Fonts, Font Awesome, Google Maps y el servicio de envío de formularios. Eso introduce dependencia de disponibilidad y cadena de suministro.

**Riesgo:** medio  
**Impacto:** caída parcial del diseño o exposición de tráfico a terceros.

### Hallazgo 3: El formulario depende de antiabuso limitado

El formulario de cotización usa validaciones, pero el antifraude visible depende sobre todo del rate limiting y de la validación del servidor. Además, el envío usa `_captcha: false` al integrarse con FormSubmit.

**Riesgo:** medio  
**Impacto:** spam, abuso automatizado y saturación del canal de contacto.

### Hallazgo 4: MFA opcional en administración

La autenticación de dos factores solo se exige si existe `CMS_OTP_SECRET`. Si esa variable no está configurada, el acceso queda en un solo factor.

**Riesgo:** alto  
**Impacto:** reducción significativa de seguridad del área privada si las credenciales se filtran.

### Hallazgo 5: Sesiones en memoria

Las sesiones se guardan en memoria del proceso. Si el servidor se reinicia, las sesiones se pierden. Además, no existe persistencia centralizada si el proyecto escala a más de una instancia.

**Riesgo:** medio  
**Impacto:** fragilidad operativa y control de sesión limitado.

### Hallazgo 6: No se observó auditoría de acciones administrativas

No se ve una bitácora de:

- inicios de sesión exitosos o fallidos
- cambios de contenido
- restablecimientos
- fallas de envío

**Riesgo:** medio  
**Impacto:** baja trazabilidad ante incidentes o cambios no autorizados.

### Hallazgo 7: No hay evidencia de política de privacidad ni consentimiento

El sitio solicita datos personales, pero no se aprecia un aviso de privacidad, política de tratamiento de datos ni consentimiento explícito.

**Riesgo:** alto  
**Impacto:** riesgo legal y de cumplimiento, especialmente para datos de contacto.

### Hallazgo 8: No se aprecia protección CSRF explícita para acciones sensibles

Aunque la cookie usa `SameSite=Lax`, no se detecta un token CSRF explícito para operaciones del CMS.

**Riesgo:** medio  
**Impacto:** mayor exposición ante ataques basados en navegación cruzada o escenarios complejos de sesión.

## 6. Qué tiene bien el sitio

- Diseño orientado a conversión y claridad comercial.
- Estructura de contacto y cotización simple para el usuario.
- Panel administrativo separado del sitio público.
- Protección básica del acceso privado.
- Validación de entradas en el backend.
- Rate limiting mínimo para frenar abuso.
- Cabeceras de seguridad fundamentales.

## 7. Qué debería tener un sitio de este estilo

### 7.1 Seguridad recomendada

- `Content-Security-Policy` estricta.
- Token CSRF en formularios administrativos.
- MFA obligatoria para el panel administrativo.
- Registro de auditoría para acciones sensibles.
- Endurecimiento de cabeceras y revisión de dependencias externas.
- Sanitización y validación profunda de contenido editable.
- Política de expiración y revocación de sesiones más robusta.

### 7.2 Privacidad y cumplimiento

- Política de privacidad visible.
- Aviso de tratamiento de datos personales.
- Consentimiento explícito para formularios.
- Información clara sobre uso de datos y tiempo de retención.

### 7.3 Operación y continuidad

- Backups del contenido editable.
- Monitoreo de errores y disponibilidad.
- Alertas ante fallos de login y de envío.
- Plan de recuperación ante caída del servidor.

### 7.4 Antispam y calidad de leads

- CAPTCHA o mecanismo de desafío.
- Honeypot invisible.
- Validación adicional del correo y teléfono.
- Filtrado de abuso por IP y por comportamiento.

## 8. Clasificación de riesgo

| Área | Estado | Riesgo |
|---|---:|---:|
| Cabeceras de seguridad | Presente | Bajo |
| Control de acceso admin | Presente | Bajo |
| MFA | Parcial | Alto |
| CSP | Ausente | Medio-alto |
| Privacidad / consentimiento | Ausente o no visible | Alto |
| Antispam | Básico | Medio |
| Auditoría | Ausente | Medio |
| Dependencias externas | Alto uso | Medio |

## 9. Conclusión

El sitio está correctamente planteado como una **landing corporativa de captación comercial** y ya incorpora varios controles útiles. No obstante, para alcanzar un nivel de seguridad y confianza acorde a un negocio que captura datos personales y administra contenido, conviene reforzar especialmente:

1. La política de seguridad de contenido.
2. La autenticación del panel administrativo.
3. La protección de formularios.
4. La trazabilidad de acciones.
5. El cumplimiento de privacidad.

En síntesis, el sitio está en un **nivel básico-intermedio de madurez de seguridad**, adecuado para una operación pequeña, pero todavía no robusto para una exposición más amplia o para manejar con mayor confianza el crecimiento del negocio.

## 10. Recomendación priorizada

1. Implementar `Content-Security-Policy`.
2. Hacer obligatoria la MFA en administración.
3. Incorporar política de privacidad y consentimiento.
4. Agregar auditoría de eventos administrativos.
5. Reforzar el formulario con antispam adicional.
6. Revisar dependencias externas y, cuando sea posible, reducirlas.

