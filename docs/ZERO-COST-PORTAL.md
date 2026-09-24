# OmyCare — portal central sin nuevas suscripciones

24 de septiembre de 2026 · Decisión de arquitectura · Código Firebase preparado; publicación pendiente

La configuración del proyecto `omycare-portal` ya fue proporcionada por Stephanie y la implementación está preparada y probada en [`firebase/`](../firebase/README.md). Todavía no se desplegó ni se migraron datos reales. Este documento conserva la justificación de la arquitectura; el estado operativo y las instrucciones vigentes están en la guía Firebase.

## Recomendación

Mantener una sola aplicación y un espacio privado por cliente. Conservar el código en GitHub, con la posibilidad de hacer privado el repositorio, y alojar la aplicación en Firebase Hosting con Firebase Authentication y Firestore, en el plan Spark sin cuenta de facturación. Los documentos permanecen en las carpetas de Google Drive que Stephanie asigna.

Esto permite un coste de nuevas suscripciones de 0 dentro de las cuotas vigentes. Requiere un servicio gratuito fuera de GitHub. No satisface una condición de alojamiento exclusivamente en GitHub Pages. Tampoco garantiza capacidad ilimitada, disponibilidad continua o gratuidad futura del proveedor.

El código no contiene respuestas de clientes. Estas se guardan en una base de datos separada, con autorización por usuario y proyecto. Que una persona pueda descargar el JavaScript de la web no debe permitirle leer ningún dato de otro cliente.

## Por qué no duplicar páginas como medida de seguridad

Una copia pública por cliente sigue exponiendo cualquier dato, documento o secreto incluido en sus archivos o en su historial. Una dirección difícil de adivinar, un selector de cliente, una contraseña comprobada en JavaScript y una instrucción para no indexar la página no son controles de acceso.

Un repositorio privado protege el código fuente en GitHub; no hace privados automáticamente los archivos publicados en un alojamiento web. GitHub Free admite repositorios privados. Pages gratuito requiere un repositorio público, y su documentación restringe ciertos usos comerciales y desaconseja transacciones sensibles como enviar contraseñas. Por estas razones no se recomienda Pages como alojamiento del portal operativo con acceso de clientes. [Planes de GitHub](https://docs.github.com/en/get-started/learning-about-github/githubs-plans), [límites de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

La demostración actual de Pages puede mantenerse con ejemplos ficticios. No hay que poner exportaciones reales, contraseñas, membresías, conversaciones o carpetas privadas en el repositorio.

## Componentes y coste

| Componente | Uso previsto | Condición para no añadir costes |
| --- | --- | --- |
| GitHub Free | Código y versiones; repositorio privado posible | Sin complementos de pago. Despliegue manual inicial para no depender de minutos de automatización facturables. |
| Firebase Hosting, plan Spark | Interfaz FR/EN y recursos públicos de la aplicación | Usar el subdominio gratuito y mantener las cuotas. No confundir Hosting con App Hosting. |
| Firebase Authentication | Google o email y contraseña, con dirección verificada | Sin SMS ni autenticación empresarial. No utilizar enlaces mágicos como acceso principal. |
| Cloud Firestore, plan Spark | Respuestas, seguimiento, miembros, conversaciones y permisos | Base de datos con reglas estrictas y consultas acotadas. |
| Drive existente | Una carpeta restringida por cliente | Utilizar el espacio disponible de la cuenta actual; no se añade almacenamiento contratado. |
| Cal.com existente | Los tres enlaces de reserva ya indicados | Enlaces a la configuración existente; sin nueva integración de pago. |

Spark puede utilizarse sin información de pago. Para conservar ese límite económico, no vincular una cuenta de Cloud Billing ni activar Blaze. Si se agota una cuota, una operación o el servicio afectado puede dejar de funcionar hasta su renovación; no se debe anunciar capacidad ilimitada. [Planes de Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

### Límites relevantes verificados

| Recurso | Cuota gratuita publicada |
| --- | --- |
| Datos en Firestore | 1 GiB total |
| Lecturas de documentos | 50.000 por día |
| Escrituras de documentos | 20.000 por día |
| Transferencia saliente de Firestore | 10 GiB por mes |
| Archivos de la web en Hosting | 10 GB, incluidas versiones retenidas |
| Transferencia de Hosting | La guía operativa indica 10 GB por mes |
| Emails de verificación de cuenta | 1.000 por día |
| Emails de recuperación de contraseña | 150 por día |
| Emails para iniciar sesión por enlace | 5 por día; insuficiente como método principal |

Cuotas compartidas por la aplicación, no por cada cliente. Una lectura o escritura es una operación de base de datos, no necesariamente una visita o un campo. Los mensajes, consultas administrativas y comprobaciones de permisos también consumen recursos. No se puede fijar un número fiable de clientes sin medir su uso.

Fuentes: [cuotas de Firestore](https://firebase.google.com/docs/firestore/quotas), [uso de Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing), [límites de Authentication](https://firebase.google.com/docs/auth/limits). La [tabla general de precios](https://firebase.google.com/pricing) expresa la transferencia de Hosting como 360 MB/día; la guía del producto describe el corte mensual de 10 GB. Verificar el panel al activar el proyecto.

## Acceso y aislamiento previstos

Stephanie tendría un panel con todos los proyectos, su avance y las conversaciones pendientes. Cada cliente entraría con una identidad propia y vería únicamente los proyectos a los que se le haya autorizado.

- La sesión debe verificarse mediante Authentication. Crear una cuenta no concede acceso a proyectos.
- Las membresías y el rol administrativo se controlan mediante reglas de Firestore. El primer administrador se configura por su identificador de cuenta verificada desde una herramienta de confianza.
- Solo Stephanie puede conceder membresías, modificar alcance, horas, reuniones realizadas, cursos incluidos o la carpeta asignada.
- El cliente puede completar respuestas, crear pestañas y participar en las conversaciones permitidas.
- Las notas internas se guardan en documentos separados, inaccesibles para clientes. Ocultar una sección en pantalla no basta.
- Toda lectura y escritura comprueba la pertenencia al proyecto. Manipular una URL, un identificador de empresa o una petición directa no concede permisos.
- Las consultas del cliente se limitan a sus proyectos. Nunca se descarga toda la cartera al navegador para filtrarla allí.
- Los datos de trabajo privados no se guardan en los archivos públicos de Hosting. La sesión y las vistas se limpian al cerrar sesión o cambiar de cuenta; la caché persistente de datos sensibles debe permanecer desactivada.
- Las pruebas deben intentar leer y modificar datos del cliente B con una cuenta del cliente A, acceder sin sesión, elevar privilegios y recuperar información tras revocar una membresía.

Las reglas del servicio aplican la autorización; no equivalen a filtros que ocultan resultados después de descargarlos. [Condiciones de seguridad de Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions).

## Funciones dentro de este diseño

| Necesidad | Resolución propuesta |
| --- | --- |
| Cuestionario FR/EN, tablas y simuladores | Reutilizar el frontend existente. Guardar por secciones, con revisiones para evitar sobrescrituras. |
| Seguimiento de configuración y ocho reuniones | Conservar la separación entre progreso del cliente y trabajo de Stephanie. |
| Conversación en cada contexto | Hilos por sección, campo, fila, tarea, reunión y pestaña, con identificadores estables. Mensajes independientes con autor, fecha y estado abierto/resuelto. |
| Bandeja administrativa | Proyectos y conversaciones pendientes visibles solo para Stephanie. |
| Documentos | Abrir la carpeta privada de Drive y añadir enlaces en la pestaña correspondiente. |
| Formaciones contratadas | Autorizar por cuenta y proyecto; obtener enlaces privados únicamente cuando el curso esté habilitado. |
| Copias de seguridad | Exportación administrativa periódica a un lugar privado y prueba de restauración. Nunca subirlas al repositorio. |

Las notificaciones de conversación iniciales serían dentro del portal. Los emails automáticos de nuevos comentarios no están incluidos en esta propuesta básica; el envío de emails de Authentication no es un servicio de correo general.

## Límites que requieren una decisión separada

**Subida a Drive.** Vincular una carpeta no permite a la aplicación escribir en ella. La versión inicial gratuita abre Drive y usa los permisos de Google del cliente. La carga directa desde el portal necesita una integración OAuth específica y pruebas de permisos. La alternativa de cargar usando una conexión permanente de Stephanie requiere proteger sus tokens en un servicio de servidor; no se presenta como ya cubierta por Firebase Spark.

**Formaciones.** Ocultar un enlace no protege un curso que sigue publicado en GitHub Pages. Para restringir el contenido original habrá que retirarlo del alojamiento público y servir sus materiales con autorización. Los códigos compartidos no sustituyen los permisos individuales. Los cursos actuales no se vuelven privados con esta propuesta.

**Accesos Zendesk.** La primera versión de esta arquitectura utiliza la cuenta nominal de consultoría ya prevista. El buzón cifrado de contraseñas temporales del servidor actual no se traslada automáticamente a Firestore: requiere un diseño separado de cifrado, claves, caducidad y recuperación. No almacenar contraseñas en respuestas, comentarios o documentos.

**Servicios de pago excluidos.** Cloud Functions, App Hosting y Cloud Storage de Firebase no forman parte de la arquitectura Spark propuesta. Cloud Storage exige Blaze incluso cuando el consumo pudiera quedar dentro de una cuota sin cargo. [Requisitos de Cloud Storage](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [precios de Firebase](https://firebase.google.com/pricing).

Las copias y restauraciones administradas de Firestore también requieren facturación. La exportación manual prevista no equivale a ese servicio ni a una garantía de recuperación continua. [Cuotas y funciones de Firestore](https://firebase.google.com/docs/firestore/quotas).

## Por qué cambia la sugerencia anterior de Supabase

Supabase también ofrece una modalidad gratuita, pero su servidor de correo incluido solo permite destinatarios del equipo del proyecto y limita el envío a dos mensajes por hora. El acceso de clientes por email exigiría configurar otro proveedor SMTP. Firebase Authentication permite la combinación propuesta de Google o email y contraseña sin ese componente adicional. [Documentación SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## Pasos para activarlo

1. Crear un proyecto Firebase propiedad de OmyCare en Spark, sin cuenta de facturación. Elegir la ubicación europea de la base de datos antes de cargar información.
2. Configurar Authentication y el administrador verificado. Registrar membresías por cliente.
3. Adaptar la persistencia del portal a Firestore, con reglas de denegación por defecto y pruebas de aislamiento. No trasladar directamente la confianza en cabeceras del servidor actual.
4. Implementar los hilos y separar notas internas, permisos y datos visibles del proyecto.
5. Publicar la interfaz en Hosting. Revisar el paquete publicado para impedir que incluya exportaciones, datos de prueba identificables, claves privadas o materiales de cursos restringidos.
6. Ejecutar un piloto con dos empresas ficticias, dos cuentas de cliente y Stephanie. Comprobar accesos cruzados, concurrencia, exportación, restauración y revocación.
7. Migrar los proyectos que se autoricen y validar el resultado. Después, decidir la retirada de la demostración de Pages y el cambio de visibilidad del repositorio para no interrumpir el acceso existente.

No se creó un proyecto Firebase, no se activó facturación y no se migraron datos en esta evaluación. El portal compartido actual sigue utilizando su alojamiento y acceso mediante ChatGPT; Pages sigue siendo la demostración local. Esta entrega actualiza la decisión técnica y no anuncia una migración terminada.

Si el requisito definitivo fuera «solo GitHub, sin ningún servicio externo», no se cumplirían a la vez el guardado compartido y el aislamiento real entre clientes. Duplicar páginas tampoco resuelve esa limitación. En ese caso, los documentos de trabajo tendrían que permanecer en herramientas privadas como Drive, con menos integración.

