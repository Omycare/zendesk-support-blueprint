# OmyCare - Blueprint de entrega

24 de septiembre de 2026 · Reservas, documentos y pestañas de trabajo · Portal FR/EN · Responsable: Stephanie

## Producto

Un espacio de trabajo por cliente: respuestas guiadas, ejemplos y simulaciones de Zendesk, más visibilidad del trabajo de configuración. El cliente completa pequeñas etapas a su ritmo y puede dejar decisiones pendientes. Stephanie actualiza el trabajo, las reuniones y el alcance de las formaciones.

La interfaz usa los PNG originales y la paleta #0e0452, #6e4ff5, #5a3297 y blanco. Cambiar el idioma cambia las etiquetas; no traduce automáticamente el texto libre del cliente.

## Recorrido

1. **Votre entreprise / Your business**: bloque de 5 minutos orientativos, con entradas y revisión propia.
2. **Marques & canaux / Brands & channels**: bloque de 7 minutos orientativos, con entradas y revisión propia.
3. **Équipes & accès / Teams & access**: bloque de 7 minutos orientativos, con entradas y revisión propia.
4. **Clients & organisations / Customers & organizations**: bloque de 5 minutos orientativos, con entradas y revisión propia.
5. **Champs de ticket / Ticket fields**: bloque de 10 minutos orientativos, con entradas y revisión propia.
6. **Formulaires & conditions / Forms & conditions**: bloque de 8 minutos orientativos, con entradas y revisión propia.
7. **Vues & dossiers / Views & folders**: bloque de 7 minutos orientativos, con entradas y revisión propia.
8. **Cycle de traitement / Ticket lifecycle**: bloque de 5 minutos orientativos, con entradas y revisión propia.
9. **Réponses & macros / Replies & macros**: bloque de 8 minutos orientativos, con entradas y revisión propia.
10. **Routage & règles / Routing & rules**: bloque de 10 minutos orientativos, con entradas y revisión propia.
11. **Horaires & engagements / Hours & service targets**: bloque de 8 minutos orientativos, con entradas y revisión propia.
12. **Aide & intelligence artificielle / Help & AI**: bloque de 8 minutos orientativos, con entradas y revisión propia.
13. **Rapports & mise en service / Reporting & launch**: bloque de 7 minutos orientativos, con entradas y revisión propia.
14. **Récapitulatif & export / Review & export**: bloque de 3 minutos orientativos, con entradas y revisión propia.

Las tablas aceptan escritura, nuevas filas y pegado desde Excel. Doce tablas opcionales desplegables cubren DNS, apps, horarios, campos de usuario/organización, escalaciones, notificaciones, CSAT, importaciones y análisis.

## Simuladores

Dropdown: Livraison::Retard y Livraison::Colis perdu muestran opciones agrupadas. Vistas: Support::Urgent se visualiza como una carpeta con una vista; un tercer nivel admite subcarpeta. Formularios: el campo de número de pedido aparece al elegir el motivo configurado. Macros: vista previa de respuesta pública o nota interna. Reglas: prueba de grupo, estado y tiempo para explicar una asignación propuesta. SLA: horas objetivo frente a horas consumidas.

Son recreaciones pedagógicas, no una instancia de Zendesk. Las reglas solo evalúan los criterios expuestos; el SLA no calcula calendarios reales ni todas las transiciones. Talk, IA, SSO, objetos personalizados y el enrutamiento omnicanal quedan como necesidades de configuración a validar, sin prometer simulación exhaustiva.

## Correspondencia con el documento fuente

Fuente: [French Workflow](https://docs.google.com/spreadsheets/d/1DpfOoZr_leMDt5IfUx26-1dRPEBRYVYelEB4cO3RUwo/edit). Se leyeron las 26 pestañas; algunas estaban vacías. Se conservaron las categorías y los encabezados de las importaciones pertinentes. Los datos de ejemplo del archivo no se convierten en datos reales de clientes. El original no se modificó.

| Pestaña original | Etapa del portal |
| --- | --- |
| Instructions | 1. Votre entreprise |
| Cahiers des charges | 1. Votre entreprise |
| Check List | 13. Rapports & mise en service |
| Email - DNS | 2. Marques & canaux |
| Canaux | 2. Marques & canaux |
| Apps | 2. Marques & canaux |
| Horaires | 11. Horaires & engagements |
| Groupes | 3. Équipes & accès |
| Champs de ticket | 5. Champs de ticket |
| Champs utilisateur | 4. Clients & organisations |
| Champs organisation | 4. Clients & organisations |
| Statuts | 8. Cycle de traitement |
| SLA | 11. Horaires & engagements |
| Déclencheurs | 10. Routage & règles |
| Automatisations | 10. Routage & règles |
| Flux / escalades | 10. Routage & règles |
| Macros | 9. Réponses & macros |
| Vues | 7. Vues & dossiers |
| Notes | 13. Rapports & mise en service |
| Notifications | 9. Réponses & macros |
| CSAT | 13. Rapports & mise en service |
| FAQ | 12. Aide & intelligence artificielle |
| Import des organisations | 13. Rapports & mise en service |
| Import des utilisateurs | 13. Rapports & mise en service |
| Exemple de macros import | 9. Réponses & macros |
| Analyse | 13. Rapports & mise en service |

## Seguimiento y alcance

Dos avances independientes: pasos del documento marcados como revisados y tareas de configuración terminadas dentro del alcance. Revisar un paso no demuestra que esté configurado en Zendesk. Las tareas fuera de alcance no inflan el porcentaje pendiente. Cada tarea registra estado, horas reales y nota visible para el cliente. Los estados de Jira no se sincronizan automáticamente.

Hay exactamente ocho reuniones de 30 minutos: fecha, nota y casilla de realizada. Solo las casillas marcadas consumen el contador. El total máximo previsto es 240 minutos; las horas de configuración se contabilizan por separado y no representan una factura.

El botón para reservar reuniones abre https://cal.com/stephaniebuquet. Reservar no marca automáticamente una reunión como celebrada; el seguimiento del cupo sigue siendo manual.

## Documentos y pestañas de trabajo

La sección Documents & ateliers / Documents & workspaces permite crear pestañas por tema, con notas compartidas, tablas de trabajo y enlaces a documentos. Se pueden archivar y restaurar, y se incluyen en JSON/XLSX. Stephanie asigna una carpeta de Google Drive por proyecto; los clientes pueden abrirla y subir allí sus archivos con sus permisos de Google, pero no cambiar su asignación en el portal.

La carga actual se realiza al abrir la carpeta en Google Drive. La carga automática desde la web hacia esa carpeta necesita una conexión Google autorizada y todavía no está activa. Tampoco se activaron conversaciones con hilos: las notas siguen siendo texto editable. El diseño completo de ambas ampliaciones está en [Documentos, reservas y colaboración](COLLABORATION-AND-DRIVE.md).

| Jira | Tarea FR | Task EN |
| --- | --- | --- |
| KAN-548 | Modèle des emails | Email template |
| KAN-549 | Notifications | Notifications |
| KAN-550 | Identité & langues | Branding & localization |
| KAN-551 | Calendrier de travail | Business schedule |
| KAN-552 | Configuration DNS des emails | Email DNS configuration |
| KAN-553 | Activation des canaux | Channel activation |
| KAN-554 | Applications complémentaires | Additional apps |
| KAN-555 | Explore, Talk & Chat | Explore, Talk & Chat |
| KAN-556 | Paramètres avancés des clients | Advanced customer settings |
| KAN-557 | Champs de ticket | Ticket fields |
| KAN-558 | Formulaires | Ticket forms |
| KAN-559 | Champs utilisateur | User fields |
| KAN-560 | Champs organisation | Organization fields |
| KAN-561 | Vues | Views |
| KAN-562 | Satisfaction client | Customer satisfaction |
| KAN-563 | Macros | Macros |
| KAN-564 | Contenu dynamique | Dynamic content |
| KAN-565 | Interface agent | Agent interface |
| KAN-566 | Statut En pause | On-hold status |
| KAN-567 | Traitement des VIP — à confirmer | VIP handling — to confirm |
| KAN-568 | Export des rapports | Report exports |
| KAN-569 | Import des données | Data imports |
| KAN-570 | Engagements SLA | SLA commitments |
| KAN-571 | Groupes | Groups |
| KAN-572 | Mots signalant une urgence | Urgency keywords |
| KAN-573 | Vérification des demandes anonymes — à confirmer | Anonymous request verification — to confirm |
| KAN-574 | Déclencheur de réponse publique — à préciser | Public-reply trigger — to clarify |

Los títulos truncados o ambiguos de las capturas, especialmente VIP, ajustes avanzados y trigger de comentario público, se tratan como decisiones por confirmar. No se desactiva automáticamente la verificación de usuarios anónimos.

## Acceso y permisos

El portal publicado es privado. Stephanie crea el proyecto, autoriza el email del cliente dentro del proyecto y le concede acceso al sitio desde Compartir. Ambos permisos son necesarios. Los visitantes se identifican con ChatGPT. No se han enviado invitaciones. El cliente ve solo sus proyectos, completa sus respuestas y consulta avances; no modifica el alcance pagado, las horas, las reuniones ni el catálogo. El modo de vista previa del cliente no cambia los permisos reales.

Datos de arranque: URL HTTPS de la instancia Zendesk, email del propietario, modalidad y estado de entrega de acceso. La opción preferida es una cuenta nominal para stephanie@omycare.fr. La alternativa es un formulario específico de usuario y contraseña temporal, cifrado en el servidor y ajeno al JSON del proyecto.

La contraseña puede ser recuperada una sola vez por Stephanie; después se elimina el registro activo. Caduca a los siete días. Los registros cifrados vencidos se purgan en la próxima operación del módulo de acceso. No se guarda el secreto en localStorage, tablas, historial de cambios o exportaciones. La aplicación no configura el rol de la cuenta en Zendesk ni recibe códigos MFA.

## Formaciones

Catálogo compartido con las dos URLs entregadas: agentes y administradores. Cada proyecto tiene una casilla de formaciones incluidas y selección individual de los cursos contratados. Los enlaces seleccionados se muestran al cliente después de validar su código en el servidor; las claves indicadas por Stephanie se configuraron como secretos y no se distribuyen en este documento. Los intentos están limitados por usuario y curso.

La validación protege el paso de apertura dentro del portal. No vuelve privados los sitios públicos existentes en GitHub Pages: una persona que ya tenga una URL directa puede abrirla. Para restringir también el contenido original hay que cambiar su alojamiento o su control de acceso. Las formaciones adicionales del catálogo admiten enlaces HTTPS, sin un código nuevo automático.

Las tarjetas de cursos habilitados ofrecen además la reserva de formación: agentes en https://cal.com/stephaniebuquet/agent-formation y administradores en https://cal.com/stephaniebuquet/admin-formation. Los enlaces no aparecen como opciones de formación para clientes sin ese curso incluido. Los calendarios externos conservan sus propios controles de acceso.

## Guardado y exportación

La versión compartida guarda respuestas y seguimiento en una base de datos. Comprueba actualizaciones remotas mientras la pantalla está inactiva. Si dos personas editan una revisión antigua, muestra el conflicto: exportar las modificaciones pendientes antes de actualizar evita perderlas. El historial conserva actor, fecha y partes modificadas, sin valores secretos.

JSON: restauración de respuestas, notas, revisiones, tareas, reuniones y selección de cursos. El catálogo global vive por separado. XLSX/CSV: dossier de configuración, tablas adicionales y seguimiento para revisión. Son archivos nuevos; no conservan todas las fórmulas o formatos del Excel original ni escriben directamente en Google Sheets. JSON técnico: borrador de llamadas de creación de campos de ticket compatibles, con etiquetas e identificadores provisionales para revisión. Regex y lookup requieren parámetros adicionales y se excluyen de la generación automática. Ningún export ejecuta cambios en Zendesk.

## Alojamiento y operación

Actualización de arquitectura del 24/09/2026: la condición de no añadir suscripciones se analiza en [Portal central sin nuevas suscripciones](ZERO-COST-PORTAL.md). Se recomienda conservar el código en GitHub y usar Firebase Hosting, Authentication y Firestore en Spark para una futura versión con acceso por email. Es una propuesta con cuotas y cambios pendientes, no una migración ya realizada. El funcionamiento descrito a continuación sigue siendo el actualmente publicado.

Frontend HTML/CSS/JavaScript, API autenticada en Worker y D1 para proyectos, miembros, historial, catálogo, acceso cifrado e intentos de código. Los secretos se mantienen en el servicio de alojamiento. El código está preparado con migraciones y pruebas.

GitHub Pages sirve archivos estáticos. La página de GitHub publica el cuestionario y los simuladores completos en modo local. Un aviso permanente explica que las respuestas quedan en el navegador y ofrece un botón para abrir el proyecto compartido. La página estática no sustituye el servicio compartido. Publicar todo el frontend compartido directamente en Pages exigiría otro backend autenticado; no se presenta como resuelto mediante almacenamiento local.

Se creó el repositorio [Omycare/zendesk-support-blueprint](https://github.com/Omycare/zendesk-support-blueprint), con el código en main y la página estática en gh-pages. Se utilizó el acceso API autorizado para la publicación. El token no se incorpora al código, a las exportaciones ni a los archivos del sitio.

## Verificación y puesta en marcha

Pruebas automáticas aprobadas: FR/EN y ejemplos, formularios condicionales, jerarquías, validaciones, persistencia, protección de exportaciones, mapeo de pestañas, 27 tareas, ocho reuniones, permisos entre clientes, revisiones concurrentes, códigos de cursos, límite de intentos, cifrado, recuperación única y expiración. Se comprobó que el XLSX se abre con un lector independiente.

La apertura de la vista previa del navegador fue rechazada por los permisos de la sesión. Queda por hacer la revisión visual en navegador real: móvil, teclado y zoom al 200%, y un piloto con datos ficticios antes de incorporar clientes. No hay sincronización activa con Jira, escritura a Google Sheets o ejecución de configuración en Zendesk.

## Primer uso

1. Entrar como Stephanie y crear un proyecto con el nombre del cliente.
2. Registrar el alcance de configuración y las formaciones pagadas.
3. Autorizar el email del cliente y darle acceso al sitio.
4. Completar Empresa, canales, equipos y acceso; avanzar luego por campos, formularios y reglas.
5. Actualizar tareas y horas cuando se realiza el trabajo; marcar reuniones al celebrarlas.
6. Revisar y exportar el dossier; comprobar el borrador técnico antes de configurar Zendesk.

## Fuentes

- [Campos personalizados de ticket](https://support.zendesk.com/hc/en-us/articles/4408838961562)
- [Listas desplegables anidadas](https://support.zendesk.com/hc/en-us/articles/4408829395738)
- [Carpetas y subcarpetas de vistas](https://support.zendesk.com/hc/en-us/articles/8009260752794)
- [Formularios](https://support.zendesk.com/hc/en-us/articles/4408846520858) y [condiciones](https://support.zendesk.com/hc/en-us/articles/4408834799770)
- [Macros](https://support.zendesk.com/hc/en-us/articles/4408844187034)
- [Triggers](https://support.zendesk.com/hc/en-us/articles/4408893545882), [automatizaciones](https://support.zendesk.com/hc/en-us/articles/4408832701850) y [SLA](https://support.zendesk.com/hc/en-us/articles/4408829459866)
- [API de campos](https://developer.zendesk.com/api-reference/ticketing/tickets/ticket_fields/)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

Documentación oficial consultada el 22/09/2026. La disponibilidad efectiva depende del plan, las funciones habilitadas y los permisos de cada instancia.
