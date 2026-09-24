# OmyCare — documentos, reservas y colaboración

Actualización del 24 de septiembre de 2026.

## Disponible en esta actualización

| Necesidad | Comportamiento |
| --- | --- |
| Reservar una reunión | Botón en Reuniones hacia https://cal.com/stephaniebuquet. No marca una reunión como realizada ni consume el contador al hacer clic. |
| Reservar formación de agentes | https://cal.com/stephaniebuquet/agent-formation. Visible en la tarjeta de agentes cuando el curso está incluido y habilitado para el proyecto. |
| Reservar formación de administradores | https://cal.com/stephaniebuquet/admin-formation. Mismo control por curso contratado. |
| Carpeta Drive por cliente | Stephanie asigna el enlace en Documents & ateliers. El servidor impide que el cliente lo cambie, incluso mediante una importación o una petición manual. |
| Pestañas de trabajo | Stephanie y los participantes del proyecto crean temas como Migración, Macros, Pruebas o Decisiones. Cada pestaña tiene notas compartidas, una tabla y enlaces a documentos. |
| Archivo y restauración | Las pestañas se pueden archivar y recuperar. Quitar un enlace del portal nunca elimina el archivo de Drive. |
| Guardado | En el portal compartido, las pestañas se guardan en el proyecto, con sus permisos e historial de cambios. JSON y XLSX incluyen notas, tablas y enlaces, no copias de los archivos. |

La versión de GitHub Pages sigue siendo una demostración local. Para trabajar entre personas se utiliza el botón del proyecto compartido. No se cambió el proveedor de acceso: el portal compartido sigue usando ChatGPT. La alternativa de acceso por email presentada anteriormente aún no se implementó.

## Cómo usar Drive ahora

1. Stephanie crea o elige una carpeta diferente para cada cliente.
2. En Google Drive, comparte esa carpeta solo con los participantes de esa empresa y OmyCare, con permiso suficiente para subir archivos. No debe compartir una carpeta padre que contenga otros clientes.
3. En el proyecto correcto, abre Documents & ateliers → Configurer le dossier de ce client y guarda el enlace de la carpeta.
4. El cliente usa Ouvrir Drive / déposer un fichier. Ya dentro de Drive, selecciona Nouveau → Importer un fichier, o arrastra el archivo.
5. Añade el enlace del documento a la pestaña de trabajo correspondiente.

Guardar la dirección de la carpeta no concede permisos en Drive. Los permisos del portal y los de Google son independientes. El portal no verifica aún que un enlace de documento pertenezca a la carpeta asignada: Stephanie y el cliente deben revisar su ubicación y sus permisos. No se ha conectado una carpeta real ni enviado invitaciones en esta actualización.

## Carga directa desde la web a Drive — pendiente de conexión

Es posible que el cliente arrastre un archivo al portal y que se guarde automáticamente en la carpeta configurada por Stephanie. Este flujo no está activo todavía: requiere registrar y autorizar la conexión de Google de la aplicación, además de asignar las carpetas reales.

Diseño previsto:

- Stephanie conecta su cuenta de Google y selecciona las carpetas autorizadas. Para una integración externa, usar OAuth con alcance mínimo viable y Google Picker; guardar los tokens de renovación cifrados en el servidor.
- La solicitud de carga solo identifica el proyecto y el archivo. El servidor verifica la sesión y la pertenencia al proyecto; obtiene la carpeta de su propia configuración. Nunca acepta del cliente una carpeta de destino arbitraria.
- Google Drive `files.create` recibe esa carpeta en `parents`. Emplear cargas reanudables, límite de tamaño, nombres normalizados y mensajes claros de error. Confirmar el éxito únicamente después de recibir la confirmación de Drive.
- Guardar en el proyecto el identificador de Drive, nombre, tamaño, tipo, autor y fecha; dejar los bytes en Drive. Consultar, descargar o quitar referencias con el mismo control de acceso por proyecto.
- La lista de archivos debe filtrarse por la carpeta del proyecto. Probar cliente A contra carpeta y documentos de B, cuentas revocadas, carga interrumpida y falta de cuota antes de habilitar el servicio.

El plugin de Drive conectado a esta conversación permite trabajar aquí con archivos autorizados; no concede automáticamente acceso permanente a la web ni a sus visitantes. No se incrustan tokens de Google o GitHub en el navegador.

## Conversaciones por campo — especificación pendiente

El requerimiento anterior se mantiene: conversaciones con autor, fecha, respuestas, no leídos y abierto/resuelto en secciones, campos, filas, tareas, reuniones y pestañas de trabajo. Notas internas de OmyCare separadas y nunca enviadas a clientes ni incluidas en sus exportaciones. Bandeja administrativa para todos los proyectos y selector de empresa basado en la cuenta autenticada.

Las notas editables de esta actualización no equivalen a un chat ni a un historial de mensajes. Los hilos requieren registros propios y referencias estables para que una fila movida no cambie el contexto del comentario. No deben almacenarse como un único texto compartido que sobrescriba las respuestas de otra persona.

## Visibilidad de formaciones

Los botones de reserva se muestran según el curso habilitado. Los calendarios de Cal.com y los cursos publicados en GitHub siguen siendo páginas externas: ocultar su botón dentro del portal no restringe el acceso a quien ya conozca la URL. Para hacer privados los contenidos originales hay que aplicar autenticación en su alojamiento. Los códigos compartidos no reemplazan los permisos por cliente.

## Fuentes técnicas

- [Google Drive: archivos dentro de una carpeta](https://developers.google.com/workspace/drive/api/guides/folder)
- [Google Drive: cargas y reanudación](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
- [Google Drive: elección de permisos OAuth](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)

## Verificación de esta entrega

Pruebas con datos ficticios: aislamiento entre proyectos, carpeta editable solo por Stephanie, conservación de pestañas al recibir un cliente antiguo, validación de enlaces, escape de texto, FR/EN, exportación y visibilidad de reservas según formación contratada. No se crearon reservas en Cal.com ni se subieron archivos de prueba a una carpeta real.
