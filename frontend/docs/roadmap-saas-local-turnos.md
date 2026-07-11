# Roadmap para convertir el sistema de turnos en un SaaS local

Este documento resume que tenemos desarrollado hoy y que deberia cambiar para convertir el sistema actual, pensado inicialmente para BIBE, en un producto generico vendible a varios negocios locales.

La idea objetivo es un micro-SaaS local: un sistema de turnos online facil de activar, con baja friccion para el negocio y para sus clientes, ofrecido como abono mensual accesible.

## 1. Vision del producto

### 1.1 Propuesta

Ofrecer a negocios locales una forma simple de tener turnos online sin desarrollar una aplicacion a medida.

Mensaje comercial posible:

```text
Tu sistema de turnos online listo en pocos dias.
Tus clientes reservan desde el celular.
Vos administras horarios, servicios y profesionales.
Sin instalar nada.
```

### 1.2 Modelo inicial

El producto deberia venderse como un paquete configurado, no como desarrollo personalizado.

Configuracion base por negocio:

- Nombre del negocio.
- Logo.
- Rubro.
- Tema visual.
- WhatsApp/contacto.
- Servicios.
- Profesionales.
- Horarios.
- Link publico para reservar.

Temas iniciales sugeridos:

- Rosa / estetica.
- Azul / salud profesional.
- Negro elegante / premium.
- Neutro / profesional simple.

### 1.3 Principio clave

El sistema debe evitar que cada cliente nuevo implique tocar codigo.

La meta es que un nuevo negocio se pueda activar desde una configuracion administrativa:

```text
Crear negocio
Elegir tema
Cargar servicios
Cargar profesionales
Cargar horarios
Compartir link
```

## 2. Estado actual del sistema

### 2.1 Que tenemos desarrollado

Hoy el proyecto ya tiene una base fuerte para un sistema de turnos de un solo negocio:

- Backend Spring Boot.
- Frontend React + TypeScript + Vite.
- Login y registro.
- Roles `ADMIN` y `CLIENT`.
- Panel administrativo.
- Area cliente.
- Sitio publico.
- Catalogo de servicios.
- Categorias de servicios.
- Profesionales.
- Relacion profesional-servicio.
- Horarios laborales.
- Bloqueos de disponibilidad.
- Calculo de disponibilidad.
- Creacion de turnos por cliente.
- Creacion de turnos por admin.
- Estados de turno.
- Historial de turnos.
- Perfil cliente.
- Servicios reservables online vs servicios de evaluacion previa.

### 2.2 Que funciona bien como base

El sistema ya resuelve la parte dificil de agenda:

- Duracion de servicios.
- Disponibilidad por profesional.
- Bloqueos.
- Turnos superpuestos.
- Servicios compatibles con profesionales.
- Servicios que el cliente puede reservar online.
- Servicios que solo puede coordinar el admin.

Esto es muy valioso para convertirlo en producto, porque no es solo una landing: ya hay logica real de operacion.

### 2.3 Limitacion principal actual

El sistema sigue pensado como una instalacion para un solo negocio.

Hoy no existe una entidad central tipo:

```text
Business / Tenant / Negocio
```

Por eso, datos como servicios, profesionales, clientes, horarios, turnos y configuracion visual no estan separados por negocio.

## 3. Backend

## 3.1 Cambios grandes

### 3.1.1 Multi-negocio / multi-tenant

Ambicion: alta.

Este es el cambio mas importante para convertirlo en SaaS.

Agregar una entidad `Business` o `Tenant`:

```text
business
- id
- name
- slug
- status
- plan
- theme
- logo_url
- whatsapp
- created_at
```

Luego asociar casi todas las entidades operativas a un negocio:

- Usuarios.
- Clientes.
- Profesionales.
- Servicios.
- Categorias.
- Horarios.
- Bloqueos.
- Turnos.

Ejemplo:

```text
services.business_id
professionals.business_id
appointments.business_id
business_hours.business_id
```

Objetivo:

```text
Un solo backend, una sola app, muchos negocios aislados entre si.
```

Riesgo:

Es un cambio estructural. Hay que hacerlo con cuidado porque afecta seguridad, consultas, filtros, validaciones y permisos.

### 3.1.2 Aislamiento de datos por negocio

Ambicion: alta.

Una vez que exista `business_id`, ningun admin debe poder ver datos de otro negocio.

Regla:

```text
Todo endpoint administrativo debe operar dentro del negocio del admin autenticado.
```

Ejemplo:

Un admin de BIBE no deberia poder consultar, editar o crear turnos en otro negocio aunque conozca IDs.

Cambios esperados:

- `AuthenticatedUser` debe conocer el negocio activo.
- Repositorios y servicios deben filtrar por `business_id`.
- Validaciones deben verificar que cliente, profesional, servicio y turno pertenecen al mismo negocio.

### 3.1.3 Modelo de usuarios para SaaS

Ambicion: alta.

Hoy existen roles simples:

```text
ADMIN
CLIENT
```

Para SaaS local conviene evolucionar a:

```text
SUPER_ADMIN
BUSINESS_ADMIN
STAFF
CLIENT
```

Version inicial posible:

- `SUPER_ADMIN`: vos, para gestionar negocios/clientes del SaaS.
- `ADMIN`: dueño o encargado de un negocio.
- `CLIENT`: cliente final que reserva turnos.

No hace falta implementar `STAFF` al inicio si complica demasiado.

### 3.1.4 Onboarding de negocios

Ambicion: alta.

Crear flujo interno para activar un negocio nuevo:

```text
Crear negocio
Crear usuario admin
Elegir tema
Cargar datos basicos
Activar link publico
```

Esto puede empezar siendo solo para `SUPER_ADMIN`, sin autoservicio.

No conviene que al principio cualquier persona se registre y cree un negocio automaticamente. Primero es mejor onboarding manual controlado.

### 3.1.5 Infraestructura y despliegue multi-cliente

Ambicion: alta.

Recomendacion inicial:

```text
1 servidor
1 backend
1 frontend
1 base de datos
muchos negocios separados por business_id
```

Evitar al inicio:

```text
1 servidor por cliente
1 backend por cliente
1 base por cliente
```

Motivo:

Si el precio mensual es bajo, la infraestructura por cliente destruye el margen y aumenta soporte/mantenimiento.

Requisitos minimos:

- Backups automaticos.
- Variables de entorno separadas.
- Logs.
- Monitoreo basico.
- SSL.
- Dominio principal.

## 3.2 Cambios medianos

### 3.2.1 Configuracion del negocio

Ambicion: media.

Agregar datos configurables por negocio:

```text
business_settings
- business_id
- public_name
- short_description
- phone
- whatsapp
- address
- instagram
- primary_color
- theme_preset
- booking_enabled
```

Uso:

- Mostrar marca en frontend.
- Definir tema visual.
- Activar/desactivar reservas online.
- Mostrar datos de contacto.

### 3.2.2 Planes comerciales

Ambicion: media.

Agregar un modelo simple:

```text
plan
- name
- max_professionals
- max_services
- max_monthly_appointments
- custom_domain_enabled
```

No hace falta automatizar cobros al inicio, pero si conviene modelar:

```text
business.plan
business.status
business.trial_ends_at
business.subscription_status
```

Estados sugeridos:

- `TRIAL`
- `ACTIVE`
- `PAUSED`
- `CANCELED`

### 3.2.3 Link publico por negocio

Ambicion: media.

Permitir URLs como:

```text
/n/bibe
/n/peluqueria-luz
/n/centro-salud-x
```

O mas adelante:

```text
bibe.tusistema.com
turnos.bibeestetica.com
```

La primera version deberia usar path por slug. Es mucho mas simple que manejar subdominios desde el dia uno.

### 3.2.4 Parametros de reserva

Ambicion: media.

Cada negocio deberia poder configurar:

- Anticipacion minima para reservar.
- Cuantos dias/semanas hacia adelante mostrar.
- Si los turnos quedan pendientes o confirmados automaticamente.
- Si el cliente puede cancelar.
- Tiempo minimo para cancelar.
- Mensaje posterior a la reserva.

Hoy hay reglas bastante fijas. Para vender a muchos rubros, algunas deberian moverse a configuracion.

### 3.2.5 Notificaciones

Ambicion: media.

Hoy existe una capa de notificaciones/no-op en backend. Para SaaS real convendria definir:

- Email de confirmacion.
- WhatsApp manual o semiautomatico.
- Recordatorios.
- Aviso al admin cuando entra un turno.

Primera version comercial:

No automatizar WhatsApp si encarece o complica. Puede bastar con:

- Pantalla admin clara.
- Mensaje copiable.
- Email simple.

### 3.2.6 Backups y recuperacion

Ambicion: media.

Necesario antes de vender a varios negocios.

Minimo:

- Backup diario de base de datos.
- Retencion de varios dias.
- Procedimiento documentado para restaurar.
- Exportacion manual de datos por negocio.

## 3.3 Cambios chicos

### 3.3.1 Seed/demo por rubro

Ambicion: baja.

Crear datos iniciales segun rubro:

- Estetica.
- Peluqueria.
- Salud/consultorio.
- Clases/profesionales.

Esto acelera demos y onboarding.

### 3.3.2 Mensajes de error mas comerciales

Ambicion: baja.

Cambiar errores tecnicos por mensajes claros:

```text
Este horario ya no esta disponible.
El servicio no esta habilitado para reserva online.
No hay profesionales disponibles para este servicio.
```

### 3.3.3 Auditoria simple

Ambicion: baja/media.

Registrar acciones importantes:

- Turno creado.
- Turno cancelado.
- Servicio desactivado.
- Horario cambiado.

No es imprescindible para vender los primeros clientes, pero ayuda si el sistema crece.

## 4. Frontend

## 4.1 Cambios grandes

### 4.1.1 Separar producto SaaS de sitio del negocio

Ambicion: alta.

Hoy la app tiene:

- Sitio publico BIBE.
- Area cliente.
- Panel admin.

Para SaaS local deberian existir dos superficies distintas:

```text
Sitio comercial del SaaS
Sitio/reserva de cada negocio
```

Ejemplo:

```text
tusistema.com
```

Muestra tu producto, precios, beneficios y contacto.

```text
tusistema.com/n/bibe
```

Muestra la experiencia de reserva de BIBE.

### 4.1.2 Public booking por negocio

Ambicion: alta.

El flujo cliente actual vive en:

```text
/app/book
```

Para venderlo como sistema simple, el cliente final no deberia sentir que entra a un panel complejo.

Futuro recomendado:

```text
/n/:businessSlug/reservar
```

Flujo:

1. Ver nombre/logo del negocio.
2. Elegir categoria.
3. Elegir servicio reservable online.
4. Elegir profesional, o que el sistema lo asigne.
5. Elegir dia y horario.
6. Dejar datos personales.
7. Confirmar solicitud.

Decision importante:

Para reducir friccion, evaluar reserva sin cuenta previa.

Hoy el sistema requiere usuario autenticado para reservar. Eso es correcto para sistema interno, pero puede ser demasiada friccion para negocios locales.

### 4.1.3 Reserva sin cuenta

Ambicion: alta.

Este puede ser uno de los cambios de producto mas importantes.

Modelo actual:

```text
El cliente se registra/inicia sesion y despues reserva.
```

Modelo mas vendible:

```text
El cliente elige turno, deja nombre + telefono + email opcional y confirma.
```

El sistema puede crear un cliente internamente sin obligarlo a manejar password.

Ventaja:

- Menos abandono.
- Mas parecido a escribir por WhatsApp.
- Mejor para negocios chicos.

Riesgo:

- Hay que prevenir spam.
- Hay que resolver como el cliente cancela o consulta su turno.
- Puede requerir token por email/WhatsApp o link unico.

### 4.1.4 Admin multi-negocio

Ambicion: alta.

El panel admin actual sirve para operar un solo negocio.

Para SaaS:

- El admin del negocio ve solo su negocio.
- El super admin ve todos los negocios.
- Debe existir una pantalla para gestionar negocios.

Pantallas nuevas para `SUPER_ADMIN`:

- Negocios.
- Estado de suscripcion.
- Plan.
- Configuracion inicial.
- Acceso rapido al admin del negocio.

### 4.1.5 Sistema de temas configurables

Ambicion: alta/media.

Hoy el estilo visual esta trabajado para BIBE y para el admin.

Para venderlo generico hay que transformar la estetica en presets:

- Rosa estetica.
- Azul profesional.
- Negro premium.
- Claro neutro.

No deberia requerir CSS nuevo por cliente.

Implementacion esperada:

```text
themePreset
primaryColor
logoUrl
```

El frontend aplica variables CSS segun configuracion del negocio.

## 4.2 Cambios medianos

### 4.2.1 Panel de configuracion del negocio

Ambicion: media.

Agregar pantalla en admin:

```text
Configuracion
```

Campos:

- Nombre publico.
- Logo.
- WhatsApp.
- Direccion.
- Redes.
- Tema visual.
- Color principal.
- Mensaje de bienvenida.
- Politica de confirmacion de turnos.

Esto permite que el negocio ajuste su presencia sin pedir cambios de codigo.

### 4.2.2 Onboarding guiado

Ambicion: media.

Cuando se crea un negocio, mostrar pasos:

```text
1. Completar datos del negocio
2. Cargar servicios
3. Cargar profesionales
4. Cargar horarios
5. Probar link de reserva
6. Compartir link
```

Esto reduce soporte y hace que el producto se sienta mas profesional.

### 4.2.3 Selector de plan/limites

Ambicion: media.

Mostrar al admin:

- Plan actual.
- Cantidad de profesionales usados.
- Cantidad de servicios usados.
- Estado del trial.

No hace falta cobrar automaticamente al inicio, pero si mostrar el estado.

### 4.2.4 Mejor experiencia mobile del admin

Ambicion: media.

El sistema ya contempla responsive, pero para negocios locales el admin probablemente use mucho celular.

Prioridades:

- Crear turno desde mobile muy rapido.
- Ver turnos de hoy.
- Confirmar/cancelar con pocos toques.
- Acceso directo a WhatsApp del cliente.
- Copiar mensaje de confirmacion.

### 4.2.5 Public site configurable por rubro

Ambicion: media.

Hoy la pagina publica de tratamientos esta pensada para estetica/BIBE y usa contenido estatico.

Para producto generico conviene separar:

- Landing comercial del SaaS.
- Mini sitio del negocio.
- Flujo de reserva.

El mini sitio del negocio podria empezar simple:

```text
Logo
Nombre
Descripcion corta
Servicios destacados
Boton reservar
WhatsApp
Ubicacion
```

No hace falta replicar una web completa por cliente al inicio.

## 4.3 Cambios chicos

### 4.3.1 Textos genericos

Ambicion: baja.

Quitar textos demasiado específicos de BIBE en pantallas reutilizables.

Ejemplos:

- Cambiar "BIBE confirma el turno" por "El negocio confirma el turno".
- Cambiar referencias esteticas en flujo cliente por lenguaje neutral.
- Mantener BIBE solo en datos configurables o demo.

### 4.3.2 Estados vacios mas vendibles

Ambicion: baja.

Los estados vacios deben explicar el siguiente paso:

```text
Todavia no cargaste servicios. Crea el primero para que tus clientes puedan reservar.
```

### 4.3.3 Packs visuales iniciales

Ambicion: baja/media.

Crear 3 o 4 presets visuales reales:

- `rose`
- `blue`
- `black-premium`
- `neutral`

Cada preset define:

- Color principal.
- Fondo.
- Bordes.
- Estilo de botones.
- Hero simple.

### 4.3.4 Demo mode

Ambicion: baja/media.

Crear demos prearmadas:

```text
/demo/estetica
/demo/peluqueria
/demo/consultorio
```

Utilidad:

- Mostrar el producto sin configurar manualmente cada presentacion.
- Vender mas facil.
- Probar temas.

## 5. Orden recomendado de trabajo

## 5.1 Etapa 1 - Convertirlo en producto activable

Ambicion: alta.

Objetivo:

Pasar de "sistema para BIBE" a "sistema para muchos negocios".

Tareas:

1. Crear entidad `Business`.
2. Agregar `business_id` a entidades principales.
3. Ajustar autenticacion para que admin/cliente pertenezcan a un negocio.
4. Filtrar todos los endpoints por negocio.
5. Crear pantalla super admin para alta de negocios.
6. Crear configuracion basica del negocio.
7. Mantener BIBE como primer negocio/demo.

Resultado:

El sistema puede alojar varios negocios sin mezclar datos.

## 5.2 Etapa 2 - Reducir friccion de reserva

Ambicion: alta/media.

Objetivo:

Que el cliente final pueda sacar turno sin sentir que usa un sistema pesado.

Tareas:

1. Crear ruta publica por negocio.
2. Crear flujo de reserva por slug.
3. Evaluar reserva sin cuenta.
4. Crear confirmacion simple.
5. Mostrar mensajes genericos configurables.
6. Permitir link directo compartible por WhatsApp/Instagram.

Resultado:

Cada negocio puede compartir un link y recibir solicitudes reales.

## 5.3 Etapa 3 - Empaquetar visualmente

Ambicion: media.

Objetivo:

Que el producto parezca configurable sin hacer desarrollo a medida.

Tareas:

1. Crear presets visuales.
2. Agregar selector de tema en admin.
3. Aplicar variables CSS por negocio.
4. Permitir logo/color.
5. Crear demos por rubro.

Resultado:

Se puede vender como "personalizado para tu negocio" aunque internamente sea el mismo sistema.

## 5.4 Etapa 4 - Operacion comercial minima

Ambicion: media.

Objetivo:

Poder cobrar, pausar y administrar clientes del SaaS.

Tareas:

1. Agregar estado de trial.
2. Agregar plan.
3. Agregar fecha de vencimiento.
4. Agregar pantalla super admin de negocios.
5. Registrar notas internas del cliente.
6. Definir proceso manual de cobro.

Resultado:

Se puede vender manualmente sin integrar pasarela de pagos desde el inicio.

## 5.5 Etapa 5 - Robustez

Ambicion: media/baja.

Objetivo:

Reducir riesgo operativo.

Tareas:

1. Backups automaticos.
2. Logs.
3. Exportacion de datos.
4. Monitoreo basico.
5. Documentacion de deploy.
6. Documentacion de restauracion.

Resultado:

El sistema deja de ser solo una app funcionando y pasa a ser un servicio mantenible.

## 6. Que no conviene hacer todavia

### 6.1 No hacer un servidor por cliente

Para un precio bajo mensual, conviene compartir infraestructura.

### 6.2 No integrar pagos automaticos al principio

Primero validar que negocios paguen manualmente.

Despues se puede integrar Mercado Pago, transferencia automatizada o facturacion.

### 6.3 No crear demasiadas personalizaciones

Evitar:

- CSS unico por cliente.
- Funcionalidades unicas por negocio.
- Paginas especiales a medida.

Ofrecer configuracion, no desarrollo personalizado.

### 6.4 No vender todas las features

El mensaje inicial deberia ser simple:

```text
Turnos online para tu negocio, configurado y listo para usar.
```

No conviene explicar multi-tenant, disponibilidad, roles, ni infraestructura al cliente final.

## 7. Riesgos principales

### 7.1 Soporte

Si el precio es bajo, el soporte debe estar limitado.

Definir:

- Horario de soporte.
- Canal.
- Alcance.
- Que cosas son configuracion incluida.
- Que cosas son desarrollo extra.

### 7.2 Friccion para el cliente final

Si hay que registrarse con password para reservar, algunos negocios pueden sentir que sus clientes no lo van a usar.

La reserva sin cuenta deberia evaluarse temprano.

### 7.3 Datos mezclados entre negocios

Es el riesgo tecnico mas importante.

Antes de vender a varios clientes reales, el aislamiento por `business_id` debe estar muy probado.

### 7.4 Precio demasiado bajo

Un precio de entrada bajo sirve para validar, pero debe tener limites.

Ejemplo:

```text
Plan Inicial
- Hasta 2 profesionales
- Hasta 20 servicios
- Turnos online
- Soporte basico
```

Y luego un plan superior.

## 8. Recomendacion concreta

### 8.1 Camino recomendado

No intentar convertir todo en SaaS perfecto de una vez.

Orden recomendado:

1. Multi-negocio con aislamiento de datos.
2. Link publico de reserva por negocio.
3. Configuracion visual basica.
4. Onboarding manual desde super admin.
5. Demo vendible para 2 o 3 rubros.
6. Primeros 3 clientes reales.
7. Ajustar segun uso real.

### 8.2 Primer objetivo comercial

Conseguir 3 negocios que usen el sistema en serio.

No importa tanto si pagan mucho al inicio. Importa validar:

- Si entienden la propuesta.
- Si sus clientes sacan turnos.
- Si el admin les resulta usable.
- Que soporte piden.
- Que funcionalidades faltan de verdad.

### 8.3 Estado deseado para primera venta

Antes de salir a ofrecerlo, idealmente tener:

- Un link demo por rubro.
- Un flujo de reserva simple.
- Un admin que funcione bien en celular.
- Configuracion de negocio desde pantalla.
- Backups basicos.
- Una explicacion comercial clara.

## 9. Resumen final

Hoy tenemos una muy buena base tecnica para un sistema de turnos real, pero todavia esta orientada a un negocio unico.

El salto a producto vendible no pasa principalmente por agregar mas features, sino por:

- Separar datos por negocio.
- Hacer onboarding simple.
- Reducir friccion para reservar.
- Permitir configuracion visual basica.
- Tener infraestructura y backups confiables.
- Evitar trabajo a medida por cliente.

La meta no deberia ser crear una startup enorme ahora, sino un micro-SaaS local validado con pocos negocios reales.

## 10. Rehacer el sistema vs modificar lo existente

Esta es una decision importante porque el sistema actual ya tiene bastante logica real construida. Rehacer puede sentirse tentador porque ahora entendemos mejor el producto, pero tambien puede retrasar la validacion comercial.

### 10.1 Razones para modificar lo que ya tenemos

Conviene seguir sobre la base actual si el objetivo principal es validar mercado pronto.

Razones:

- Ya existe una logica de turnos funcional.
- Ya hay admin operativo.
- Ya hay flujo cliente.
- Ya hay autenticacion.
- Ya hay servicios, categorias, profesionales, horarios y bloqueos.
- Ya se resolvieron problemas reales de agenda.
- Ya se puede mostrar una demo concreta.
- Se puede llegar antes a negocios reales.

Costo de oportunidad de modificar:

- El codigo actual fue pensado para un negocio unico, por lo que adaptar a multi-negocio puede dejar partes menos limpias.
- Puede haber que tocar muchas consultas y validaciones para agregar `business_id`.
- Algunas decisiones visuales y de contenido estan atadas a BIBE y hay que generalizarlas.
- El sistema puede arrastrar nombres, rutas o supuestos que no son ideales para SaaS.

Aun asi, este camino permite aprender con clientes antes de invertir demasiado tiempo en arquitectura perfecta.

### 10.2 Razones para rehacer el sistema

Conviene considerar rehacer si la prioridad es construir una base SaaS limpia antes de vender.

Razones:

- Se podria disenar multi-negocio desde el primer dia.
- Se podria separar mejor:
  - producto SaaS,
  - panel del negocio,
  - reserva publica,
  - sitio comercial.
- Se podria modelar mejor usuarios, permisos, negocios, planes y configuracion.
- Se podria evitar migrar entidades existentes a `business_id`.
- Se podria crear una arquitectura mas simple de mantener a largo plazo.
- Se podria definir desde cero una experiencia de reserva sin cuenta, pensada para baja friccion.

Costo de oportunidad de rehacer:

- Se posterga la validacion comercial.
- Se corre el riesgo de pasar meses construyendo sin clientes reales.
- Se puede volver a resolver problemas que ya estaban resueltos.
- Se pierde momentum.
- Puede aparecer la tentacion de hacer una plataforma demasiado grande antes de vender.
- Mientras se rehace, no se aprende de uso real.

El mayor riesgo de rehacer no es tecnico. Es comercial: dedicar mucho tiempo a una version ideal sin comprobar si negocios locales pagan y la usan.

### 10.3 Pregunta central para decidir

La pregunta no deberia ser:

```text
Que arquitectura es mas perfecta?
```

Sino:

```text
Que camino me acerca antes a tener 3 negocios reales usando el sistema?
```

Si el objetivo es vender localmente y aprender, modificar lo existente suele ser mejor.

Si el objetivo es buscar una plataforma escalable desde el inicio, con muchos negocios y planes complejos, rehacer puede tener sentido.

### 10.4 Decision recomendada

Recomendacion actual:

```text
No rehacer todo ahora.
```

Conviene evolucionar lo existente en etapas:

1. Generalizar textos y configuracion visual.
2. Agregar `Business`.
3. Agregar `business_id` a las entidades principales.
4. Crear una demo multi-negocio.
5. Probar con 2 o 3 negocios reales.
6. Recien despues decidir si hace falta una reescritura parcial.

Este camino mantiene lo mejor de ambos mundos:

- Aprovecha lo ya construido.
- Permite validar rapido.
- Evita enamorarse de una arquitectura antes de saber si el negocio funciona.
- Deja abierta la posibilidad de rehacer partes puntuales mas adelante.

### 10.5 Cuando si convendria rehacer

Rehacer empezaria a tener mas sentido si se cumple alguna de estas condiciones:

- Adaptar `business_id` rompe demasiadas partes del sistema.
- La autenticacion actual impide un flujo publico simple sin cuenta.
- El codigo queda muy dificil de mantener despues de intentar generalizarlo.
- Aparecen varios clientes reales y el sistema actual limita el crecimiento.
- Se decide cambiar fuerte el stack o la arquitectura de despliegue.
- Se quiere convertir el producto en SaaS autoservicio completo, no solo onboarding manual.

En ese caso, no habria que pensar en "tirar todo", sino en rehacer con criterio:

```text
Mantener aprendizajes y reglas de negocio.
Reescribir solo la base que limita el crecimiento.
Migrar datos cuando el modelo nuevo este probado.
```

### 10.6 Camino intermedio

El camino mas razonable puede ser una reestructuracion progresiva:

- Mantener backend y frontend actuales.
- Introducir `Business` primero.
- Aislar datos por negocio.
- Crear nuevas rutas publicas por negocio.
- Mantener el admin actual, pero filtrado por negocio.
- Rehacer solo el flujo de reserva si se decide permitir reserva sin cuenta.

Esto evita el extremo de:

```text
parchar todo para siempre
```

y tambien evita el extremo de:

```text
empezar de cero sin validar mercado
```

### 10.7 Conclusion de esta decision

Hoy, con el estado actual del proyecto, modificar lo existente parece tener mejor relacion costo-beneficio que rehacer todo.

La prioridad deberia ser validar el producto como servicio local. Si aparecen clientes reales, sus problemas van a indicar que partes conviene mejorar, reestructurar o rehacer.

La arquitectura perfecta antes de vender puede ser una forma elegante de postergar la parte dificil: salir a ofrecerlo.
