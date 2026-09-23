// Source: user-supplied Jira screenshots, KAN-548 through KAN-574.
export const taskDefinitions=[
[548,'Modèle des emails','Email template','Logo, pied de page et présentation des messages envoyés aux clients.','Logo, footer and layout of emails sent to customers.','brands'],
[549,'Notifications','Notifications','Vérifier les notifications et désactiver celles qui ne sont pas utiles.','Review notifications and disable unnecessary messages.','rules'],
[550,'Identité & langues','Branding & localization','Adapter les marques et les langues de votre espace.','Adapt workspace branding and languages.','company'],
[551,'Calendrier de travail','Business schedule','Configurer les jours, horaires et fuseaux de travail.','Configure working days, hours and time zones.','sla'],
[552,'Configuration DNS des emails','Email DNS configuration','Préparer et vérifier les réglages de domaine nécessaires aux emails.','Prepare and verify domain settings required for email.','brands'],
[553,'Activation des canaux','Channel activation','Relier les points de contact inclus dans votre projet.','Connect the contact channels included in your project.','brands'],
[554,'Applications complémentaires','Additional apps','Configurer les applications retenues : suivi du temps, adresse d’envoi, pièces jointes…','Configure selected apps: time tracking, sender address, attachments…','launch'],
[555,'Explore, Talk & Chat','Explore, Talk & Chat','Activer les produits inclus dans votre offre et votre périmètre.','Activate the products included in your subscription and scope.','launch'],
[556,'Paramètres avancés des clients','Advanced customer settings','Préciser les réglages concernés, puis les adapter au fonctionnement validé.','Clarify the relevant settings, then adapt them to the approved workflow.','customers'],
[557,'Champs de ticket','Ticket fields','Créer les informations et choix à recueillir sur chaque demande.','Create the information and choices collected on each request.','fields'],
[558,'Formulaires','Ticket forms','Assembler les champs et les conditions des formulaires.','Assemble form fields and conditions.','forms'],
[559,'Champs utilisateur','User fields','Configurer les informations utiles dans les profils clients.','Configure useful information in customer profiles.','customers'],
[560,'Champs organisation','Organization fields','Configurer les informations utiles sur les entreprises clientes.','Configure useful information about customer organizations.','customers'],
[561,'Vues','Views','Organiser les listes de travail et leurs dossiers.','Organize work queues and their folders.','views'],
[562,'Satisfaction client','Customer satisfaction','Préparer la mesure de satisfaction si elle est incluse.','Prepare satisfaction measurement when included.','launch'],
[563,'Macros','Macros','Préparer les réponses types et les actions associées.','Prepare reusable replies and associated actions.','macros'],
[564,'Contenu dynamique','Dynamic content','Préparer les variantes de contenu selon les langues.','Prepare content variants for different languages.','macros'],
[565,'Interface agent','Agent interface','Adapter l’espace de travail utilisé par vos équipes.','Adapt the workspace used by your teams.','teams'],
[566,'Statut En pause','On-hold status','Prévoir le traitement des demandes en attente d’un tiers.','Plan how to handle requests waiting for a third party.','statuses'],
[567,'Traitement des VIP — à confirmer','VIP handling — to confirm','Décider si des clients VIP nécessitent un traitement spécifique.','Decide whether VIP customers require special handling.','customers'],
[568,'Export des rapports','Report exports','Vérifier les droits et possibilités d’export des rapports.','Review report export permissions and capabilities.','launch'],
[569,'Import des données','Data imports','Préparer les possibilités d’import et vérifier les données à reprendre.','Prepare import capabilities and review migration data.','launch'],
[570,'Engagements SLA','SLA commitments','Configurer et tester les engagements de délai retenus.','Configure and test the agreed time commitments.','sla'],
[571,'Groupes','Groups','Créer les équipes de traitement et leurs membres.','Create handling teams and their memberships.','teams'],
[572,'Mots signalant une urgence','Urgency keywords','Définir les mots et les règles de détection d’urgence à valider.','Define urgency keywords and detection rules for review.','rules'],
[573,'Vérification des demandes anonymes — à confirmer','Anonymous request verification — to confirm','Examiner le besoin de désactiver la vérification des utilisateurs anonymes sur le formulaire. Aucun changement automatique.','Review whether anonymous-user verification should be disabled on the form. No automatic change.','forms'],
[574,'Déclencheur de réponse publique — à préciser','Public-reply trigger — to clarify','Préciser la condition, le destinataire et l’action : le titre Jira fourni est tronqué.','Clarify the condition, recipient and action: the supplied Jira title is truncated.','rules']
].map(([n,fr,en,descFR,descEN,section])=>({id:`KAN-${n}`,fr,en,descFR,descEN,section}));
export const taskStates=['todo','in_progress','blocked','done','excluded'];
const text=(v,max=6000)=>String(v??'').slice(0,max);
export function freshTracking(){return {tasks:taskDefinitions.map(t=>({id:t.id,status:'todo',hours:0,note:'',updatedAt:''})),meetings:Array.from({length:8},(_,i)=>({id:i+1,done:false,date:'',note:''})),trainingIncluded:false,trainingIds:[],summary:''}}
export function normalizeTracking(raw){const n=freshTracking();if(!raw||typeof raw!=='object')return n;n.summary=text(raw.summary);n.trainingIncluded=raw.trainingIncluded===true;n.trainingIds=Array.isArray(raw.trainingIds)?[...new Set(raw.trainingIds.filter(x=>typeof x==='string'))].slice(0,100):[];for(const t of n.tasks){const r=raw.tasks?.find?.(a=>a.id===t.id);if(r){t.status=taskStates.includes(r.status)?r.status:'todo';t.hours=Number.isFinite(Number(r.hours))?Math.max(0,Math.min(10000,Number(r.hours))):0;t.note=text(r.note);t.updatedAt=text(r.updatedAt,40)}}for(const m of n.meetings){const r=raw.meetings?.find?.(a=>a.id===m.id);if(r){m.done=r.done===true;m.date=/^\d{4}-\d{2}-\d{2}$/.test(r.date)?r.date:'';m.note=text(r.note,2000)}}return n}
export function metrics(state){const t=normalizeTracking(state.tracking);const active=t.tasks.filter(t=>t.status!=='excluded');const parts=Object.entries(state.sections||{}).filter(([id])=>id!=='review');return {documentsDone:parts.filter(([,s])=>s.reviewed).length,documentsTotal:parts.length,tasksDone:active.filter(t=>t.status==='done').length,tasksTotal:active.length,blocked:active.filter(t=>t.status==='blocked').length,hours:t.tasks.reduce((n,t)=>n+t.hours,0),meetingsDone:t.meetings.filter(m=>m.done).length,meetingMinutes:t.meetings.filter(m=>m.done).length*30}}
export function safeTrainingURL(raw){try{const u=new URL(String(raw));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
