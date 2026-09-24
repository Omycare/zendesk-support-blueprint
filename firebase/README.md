# OmyCare — versión Firebase

Versión 0.2.0 preparada el 24/09/2026 para el proyecto **omycare-portal**.

**Estado: código construido y probado; pendiente de autorización y despliegue en Firebase.** La configuración de la aplicación web se tomó de la captura proporcionada por Stephanie. No se activó facturación, no se crearon usuarios reales y no se trasladaron datos de clientes. La configuración web pública no concede permisos para administrar o publicar el proyecto.

## Lo que ya está preparado

- Acceso con Google o email y contraseña; email verificado obligatorio antes de consultar proyectos. Crear una cuenta no concede membresía.
- Administrador identificado por un UID configurado desde la consola de confianza. No se concede el rol por escribir un email o cambiar un selector.
- Proyectos privados por email autorizado, panel de todos los clientes, cuestionario FR/EN, seguimiento, ocho reuniones y carpetas Drive.
- Conversaciones en secciones, campos, celdas de tablas, tareas, reuniones y pestañas. Autor y fecha, respuestas, mensajes anteriores, abierto/resuelto y lectura por usuario.
- Notas internas en una colección separada y denegadas al cliente. El panel muestra las 100 conversaciones más recientes por espacio; cada contexto conserva acceso directo a su hilo.
- Identificadores estables de filas conservados al editar, reordenar o exportar/importar el cuestionario.
- Guardado tras una pausa de 750 ms; revisiones contra sobrescrituras simultáneas. Las actualizaciones remotas usan suscripciones al proyecto abierto, sin consultas periódicas de toda la cartera.
- Catálogo de cursos privado. Las URLs se reciben únicamente si la cuenta pertenece al proyecto y el curso está incluido. Los enlaces no están en los archivos publicados del frontend Firebase.
- Exportación de dossier y conversaciones. Incluye notas internas solo para el administrador; los JSON/XLSX anteriores del cuestionario siguen teniendo su alcance original.
- Firestore en caché de memoria y sesión limitada a la sesión del navegador. La desconexión o pérdida de acceso limpia la vista.

## Próximo paso para Stephanie

1. Terminar el asistente de registro de la aplicación web y abrir **Continue to console**.
2. En **Build → Authentication → Get started → Sign-in method**, activar **Google** y **Email/Password**. En Google, seleccionar el email de soporte de OmyCare. Mantener desactivado el acceso mediante enlaces de email y SMS para esta versión.
3. En **Build → Firestore Database → Create database**, elegir la base **(default)** de edición **Standard**, una ubicación europea apropiada y **Production mode**. La ubicación debe decidirse antes de crear la base. No usar reglas de prueba que permitan acceso público.
4. Mantener el plan **Spark**, sin asociar una cuenta de facturación. No activar App Hosting, Cloud Functions ni Cloud Storage: esta versión no los utiliza.
5. Autorizar la publicación con una sesión Firebase de la propietaria. El acceso GitHub ya conectado no autoriza Firebase. No compartir contraseñas, tokens de sesión ni archivos JSON con claves privadas en el chat o repositorio.

Fuentes: [configurar Authentication](https://firebase.google.com/docs/auth/web/start), [crear Firestore](https://firebase.google.com/docs/firestore/quickstart), [ubicaciones de Firestore](https://firebase.google.com/docs/firestore/locations), [autorización de la CLI](https://firebase.google.com/docs/cli#sign-in-test-cli).

## Publicación con una sesión autorizada

Preparación técnica: Node.js compatible con las dependencias fijadas, npm y Java 21 o superior para las pruebas de reglas. Los archivos compilados se generan en `firebase/dist`; no se publica el servidor D1 anterior ni las exportaciones de clientes.

Desde la carpeta `firebase` del repositorio:

```sh
npm ci
npx firebase login
npm run deploy
```

El último comando construye el frontend, ejecuta las pruebas y despliega exclusivamente reglas, índices de Firestore y Firebase Hosting al proyecto `omycare-portal`. No crea una cuenta de facturación ni activa servicios de pago. No se ejecutó este despliegue durante la preparación.

La dirección prevista del sitio por defecto es `https://omycare-portal.web.app`; todavía no se anuncia como portal operativo. Hay que verificar en Authentication que los dominios reales del portal estén autorizados y probar Google y email después del despliegue.

## Activar el primer administrador

1. Después de publicar, Stephanie inicia sesión en el portal con su cuenta. Antes del alta administrativa puede ver «Aucun projet attribué / No project assigned»; es el comportamiento seguro esperado.
2. En Firebase Console → Authentication → Users, localizar esa identidad verificada y copiar su **UID**.
3. En Firestore → Data, crear la colección `administrators`, con un documento cuyo ID sea exactamente ese UID.
4. Añadir el campo `enabled` de tipo **boolean**, valor **true**. Recargar el portal.

Este alta se hace desde la consola de la propietaria. Los clientes y la aplicación web no tienen permiso para escribir en `administrators`. Usar el UID de la cuenta real de Stephanie; no inventarlo ni sustituirlo por un email.

Luego Stephanie crea el proyecto de cada cliente, autoriza sus emails y asigna su carpeta Drive. El alta no envía invitaciones automáticamente. La carpeta debe compartirse en Google únicamente con los participantes correctos; los permisos de Drive siguen siendo independientes.

## Formaciones y documentos

La primera apertura administrativa del catálogo ofrece las dos formaciones OmyCare con sus identificadores estables, títulos FR/EN y enlaces vacíos. Stephanie introduce las URLs en el catálogo privado y lo guarda una sola vez. Esos identificadores conservan los botones de reserva de agentes y administradores ya previstos.

En Firebase, el acceso a esos enlaces se decide por identidad y formación contratada. No se trasladan los códigos compartidos del servidor anterior al JavaScript. Las páginas de cursos que ya están publicadas en GitHub continúan siendo públicas: para restringir los materiales originales hay que cambiar también su alojamiento. Ocultar o autorizar un enlace no protege el destino público.

Los documentos se suben abriendo Drive. La carga directa desde el portal y un buzón cifrado de contraseñas Zendesk no se incluyen en esta versión Firebase. El acceso Zendesk se realiza con la cuenta nominal de consultoría.

## Límites y recuperación

El dossier de cada proyecto admite hasta 480.000 bytes de JSON; las conversaciones viven en registros separados. Las tablas muy grandes deben quedar en Drive. Esto deja margen bajo el límite de documento de Firestore y evita guardar archivos como texto. Hay hasta 50 emails por proyecto y 20 cursos en el catálogo. Una actualización de catálogo que exceda 450 escrituras se detiene para preparar una migración explícita.

El botón «Dossier et conversations / Brief and conversations» exporta los contenidos accesibles del proyecto. No incluye membresías, permisos Google, contraseñas ni una copia de la base completa. La importación anterior de JSON restaura únicamente el cuestionario y su seguimiento; **la restauración automática de conversaciones no está implementada**. Conservar el export completo en una ubicación privada para recuperación técnica. Las copias gestionadas de Firestore no se activan en este plan.

## Cómo agregar funcionalidades después

El código del cuestionario se reutiliza desde `../frontend`. El adaptador de datos, el acceso, las conversaciones y las reglas están separados en esta carpeta. La construcción comprueba los puntos de integración para detenerse si una edición del frontend requiere adaptar Firebase.

1. Registrar la mejora y su alcance en el proyecto GitHub, sin incluir datos reales de clientes.
2. Desarrollarla en una rama y probar con datos ficticios en los emuladores. Una URL de preview de Hosting no aísla por sí sola la base; no apuntar las pruebas a datos reales.
3. Mantener lectura compatible con las versiones de datos existentes. Si cambia el esquema, preparar exportación, migración y recuperación antes de publicar.
4. Ejecutar construcción, pruebas de interfaz y reglas. Verificar permisos cuando cambien lecturas, campos, miembros o cursos.
5. Publicar la versión comprobada y registrar cambios. Una reversión del frontend no revierte automáticamente los datos.

Los proyectos de clientes se actualizan desde la misma aplicación. No se duplican repositorios por empresa. Cuando Firebase esté operativo, puede hacerse privado el repositorio y retirarse la demostración Pages como una transición coordinada.

## Verificación de esta preparación

19 pruebas nuevas aprobadas: 3 de modelo, 5 de interfaz DOM y 11 contra el emulador oficial de Firestore. Incluyen acceso anónimo y no verificado, cruces entre clientes, intento de elevar permisos, manipulación de alcance/carpeta, revisión concurrente, altas y revocaciones, cursos, autoría e inmutabilidad de mensajes, notas internas y exportaciones. También pasaron las pruebas existentes de cuestionario y seguimiento.

Pendiente antes de clientes reales: activar servicios, autorizar despliegue, crear el administrador, probar acceso real Google/email, verificar visualmente móvil/teclado/zoom y realizar un piloto con dos empresas ficticias en el alojamiento final. Las pruebas locales no demuestran que el proyecto de producción ya tenga las reglas publicadas.
