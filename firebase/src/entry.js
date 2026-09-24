import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider,
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification,
  sendPasswordResetEmail, onIdTokenChanged, signOut, reload } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from './config.js';
import { createBackend } from './backend.js';
import { createConversations } from './conversations.js';

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: browserSessionPersistence, popupRedirectResolver: browserPopupRedirectResolver });
const db = initializeFirestore(app, { localCache: memoryLocalCache() });
const backend = createBackend(db, auth);
let language = localStorage.getItem('omycare-language') === 'en' ? 'en' : 'fr';
let loadedUser = '', loadingUser = false;
const tr = (fr, en) => language === 'fr' ? fr : en;
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function authMessage(error) {
  const code = String(error?.code || '');
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return tr('Email ou mot de passe incorrect.','Incorrect email or password.');
  if (code.includes('email-already-in-use')) return tr('Ce compte existe déjà. Utilisez Connexion ou Mot de passe oublié.','This account already exists. Use Sign in or Forgot password.');
  if (code.includes('weak-password')) return tr('Choisissez un mot de passe plus long.','Choose a longer password.');
  if (code.includes('too-many-requests')) return tr('Trop de tentatives. Réessayez plus tard.','Too many attempts. Please try later.');
  if (code.includes('operation-not-allowed') || code.includes('configuration-not-found')) return tr('Ce mode de connexion n’est pas encore activé. Contactez Stephanie.','This sign-in method is not yet enabled. Contact Stephanie.');
  if (code.includes('popup-closed-by-user')) return tr('Connexion annulée.','Sign-in cancelled.');
  if (code.includes('unauthorized-domain')) return tr('Cette adresse du portail doit être autorisée par Stephanie.','Stephanie needs to authorize this portal address.');
  return tr('Connexion indisponible. Vérifiez votre connexion et réessayez.','Sign-in unavailable. Check your connection and try again.');
}
function shell(content) {
  document.documentElement.lang = language;
  document.querySelector('#app').innerHTML = `<main class="auth-shell"><section class="auth-card"><img class="auth-logo" src="assets/omycare-logo.png" alt="OmyCare"><div class="auth-language"><button id="auth-language">${language === 'fr' ? 'English' : 'Français'}</button></div>${content}<p class="auth-foot">${tr('Votre projet Zendesk, un pas à la fois.','Your Zendesk project, one step at a time.')}</p></section></main>`;
  document.querySelector('#auth-language').onclick = () => { language = language === 'fr' ? 'en' : 'fr'; localStorage.setItem('omycare-language', language); showAuth(auth.currentUser); };
}
async function run(button, action) {
  const message = document.querySelector('#auth-message');
  button.disabled = true; if (message) message.textContent = '';
  try { await action(); } catch (error) { if (message?.isConnected) message.textContent = authMessage(error); }
  finally { if (button.isConnected) button.disabled = false; }
}
function showAuth(user) {
  document.querySelector('#account-bar').replaceChildren();
  if (user && !user.emailVerified) {
    shell(`<h1>${tr('Vérifiez votre email','Verify your email')}</h1><p>${escape(user.email)}</p><p>${tr('Ouvrez le lien de vérification reçu par email, puis revenez ici.','Open the verification link sent to your email, then return here.')}</p><div class="auth-actions"><button class="primary" id="check-email">${tr('J’ai vérifié mon email','I verified my email')}</button><button id="resend-email">${tr('Renvoyer le lien','Resend verification')}</button><button id="change-account">${tr('Changer de compte','Change account')}</button></div><p id="auth-message" role="status"></p>`);
    document.querySelector('#check-email').onclick = e => run(e.target, async () => { await reload(user); await user.getIdToken(true); if (!user.emailVerified) document.querySelector('#auth-message').textContent = tr('La vérification n’est pas encore confirmée.','Verification is not confirmed yet.'); });
    document.querySelector('#resend-email').onclick = e => run(e.target, async () => { auth.languageCode = language; await sendEmailVerification(user); document.querySelector('#auth-message').textContent = tr('Email de vérification envoyé.','Verification email sent.'); });
    document.querySelector('#change-account').onclick = () => signOut(auth);
    return;
  }
  shell(`<span class="eyebrow">SUPPORT BLUEPRINT</span><h1>${tr('Bienvenue dans votre espace','Welcome to your workspace')}</h1><p>${tr('Connectez-vous avec l’adresse autorisée par Stephanie.','Sign in with the email address authorized by Stephanie.')}</p><button id="google-login" class="primary auth-google">${tr('Continuer avec Google','Continue with Google')}</button><div class="auth-divider">${tr('ou avec votre email professionnel','or with your work email')}</div><form id="email-login"><label for="auth-email">Email</label><input id="auth-email" type="email" autocomplete="username" required><label for="auth-password">${tr('Mot de passe','Password')}</label><input id="auth-password" type="password" autocomplete="current-password" required><div class="auth-actions"><button class="primary" type="submit">${tr('Connexion','Sign in')}</button><button id="create-account" type="button">${tr('Créer mon compte','Create my account')}</button></div></form><button id="reset-password" class="auth-reset">${tr('Mot de passe oublié','Forgot password')}</button><p id="auth-message" role="status"></p><p class="muted">${tr('Créer un compte ne donne accès qu’aux projets qui vous sont attribués.','Creating an account only gives access to projects assigned to you.')}</p>`);
  document.querySelector('#google-login').onclick = e => run(e.target, async () => {
    const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' }); auth.languageCode = language;
    await signInWithPopup(auth, provider);
  });
  document.querySelector('#email-login').onsubmit = e => { e.preventDefault(); run(e.submitter, () => signInWithEmailAndPassword(auth, document.querySelector('#auth-email').value.trim(), document.querySelector('#auth-password').value)); };
  document.querySelector('#create-account').onclick = e => run(e.target, async () => {
    if (!document.querySelector('#email-login').reportValidity()) return;
    if (document.querySelector('#auth-password').value.length < 10) throw {code:'auth/weak-password'};
    const result = await createUserWithEmailAndPassword(auth, document.querySelector('#auth-email').value.trim(), document.querySelector('#auth-password').value);
    auth.languageCode = language; await sendEmailVerification(result.user);
  });
  document.querySelector('#reset-password').onclick = e => run(e.target, async () => {
    const email = document.querySelector('#auth-email'); if (!email.reportValidity()) return;
    auth.languageCode = language; await sendPasswordResetEmail(auth, email.value.trim());
    document.querySelector('#auth-message').textContent = tr('Si cette adresse possède un compte, les instructions de récupération seront envoyées.','If this address has an account, recovery instructions will be sent.');
  });
}
function accountBar(user) {
  const bar = document.querySelector('#account-bar');
  bar.innerHTML = `<span>${escape(user.email)}</span><button id="firebase-signout">${tr('Déconnexion','Sign out')}</button>`;
  document.querySelector('#firebase-signout').onclick = async () => {
    const controller = window.BLUEPRINT_CONTROLLER;
    if (controller && !await controller.flush() && !confirm(tr('Des modifications ne sont pas enregistrées. Quitter sans les conserver ?','Some changes are unsaved. Leave without keeping them?'))) return;
    backend.stop(); await signOut(auth);
  };
}
window.BLUEPRINT_SHARED = true;
window.BLUEPRINT_FIREBASE = true;
window.BLUEPRINT_API = backend.api;
window.BLUEPRINT_CONVERSATIONS = createConversations(backend);
window.BLUEPRINT_ON_RENDER = context => window.BLUEPRINT_CONVERSATIONS.mount(context);
onIdTokenChanged(auth, async user => {
  if (loadedUser && (!user || !user.emailVerified || user.uid !== loadedUser)) { backend.stop(); location.reload(); return; }
  if (!user?.emailVerified) { showAuth(user); return; }
  if (loadedUser || loadingUser) return;
  loadingUser = true;
  try {
    window.BLUEPRINT_LANG = language;
    accountBar(user);
    loadedUser = user.uid;
    await import('./app.js');
  } catch {
    loadedUser = '';
    shell(`<h1>${tr('Chargement interrompu','Loading interrupted')}</h1><p>${tr('Actualisez la page pour réessayer.','Refresh this page to try again.')}</p>`);
  } finally { loadingUser = false; }
});
