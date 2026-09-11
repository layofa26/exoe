# 🛡️ RAPÒ ODIT TEKNIK & LIS PWOBLEM SISTÈM (EXILE & X-VAULT)
*Dokiman analiz detaye sou tout fonksyonalite, sekirite, medya, ak achitekti WebSocket*

---

## 1. 🎬 Pwoblèm Medya & Videyo ki pa parèt nan Feed la

### A. Absans Proxy /media nan konfigirasyon Vite (vite.config.ts)
* **Konsta :** Nan vite.config.ts, sèl /api ki konfigire nan proxy dev sèvè a (	arget: 'http://127.0.0.1:8000').
* **Konsekans :** Lè aplikasyon an mande yon videyo oswa yon kouvèti lokal (/media/videos/... oswa /media/covers/...), sèvè Vite a pa voye requete a bay Django. Li reponn ak kòd 200 OK text/html (li retounen paj index.html).
* **Enpak sou jwè a :** Baliz HTML5 <video src=/media/...> resevwa fichye HTML olye de videyo MP4, sa ki lakòz yon erè dekodaj imedyat, videyo a pa parèt oswa feed la rete blanch.

### B. URL Medya Hardcode sou localhost:8000 (src/services/videoApi.ts)
* **Konsta :** Fonksyon resolveMediaUrl() itilize http://localhost:8000 kòm fallback.
* **Konsekans :** Lè yon itilizatè ouvri sit la sou yon telefòn mobil oswa sou tinèl Cloudflare a (	rycloudflare.com), telefòn nan eseye telechaje videyo a sou http://localhost:8000/media/.... Piske telefòn nan pa gen Django k ap vire sou li, requete a echwe nèt (ERR_CONNECTION_REFUSED).
* **Solisyon rekòmande :** Proxy /media nan vite.config.ts menm jan ak /api, epi itilize URL relatif sou dev ak tinèl.

---

## 2. ⚡ Absans WebSocket pou Mizajou an Tan Reyèl (Polling vs WebSocket)

### A. Surcharge HTTP Polling nan Dashboard la
* **Konsta :** Kounye a, VaultOverview.tsx itilize setInterval(fetchOverviewStats, 20000) (chak 20 segonn) epi UsersSection.tsx itilize setInterval(fetchRealUsers, 30000) (chak 30 segonn).
* **Konsekans :** 
  * Requete HTTP repete tout tan menm lè pa gen anyen ki chanje nan baz done a.
  * Surcharge nesesè sou baz done PostgreSQL/SQLite ak CPU sèvè a.
  * Dega sou latans : si yon itilizatè enskri oswa si yon aksyon fèt, admin nan oblije tann jiska 30 segonn anvan li wè l.

### B. Enfrastrikti WebSocket ki deja pare men ki poko itilize pou Vault
* **Konsta :** Django gen deja daphne, channels==4.2.0, ak InMemoryChannelLayer enstale nan settings.py ak sgi.py. Sèl modil ki itilize WebSocket kounye a se conversations (ws/chat/).
* **Solisyon rekòmande :**
  1. Kreye yon Consumer WebSocket dedye pou X-Vault (ws/vault/live-events/).
  2. Lè yon nouvo itilizatè enskri, lè yon kont sispann/banni, oswa lè yon rapò bèg tonbe, Django voye yon evènman nan Channel Layer a.
  3. Frontend Vault la konekte sou WebSocket sa a pou mete ajou kontè yo ak lis itilizatè yo enstantaneman san okenn polling.

---

## 3. 🔒 Faille de Sekirite & Otantifikasyon

### A. Jeton JWT ki pa revoke touswit lè yon kont sispann
* **Konsta :** Lè admin lan sispann (suspend) oswa banni (an) yon kont, is_active pase a False nan baz la. Men Access Token JWT itilizatè a te deja genyen sou aparèy li rete valab jiskaske li ekspire (15 a 60 minit).
* **Risk :** Yon itilizatè malveyan ki fèk sispann ka kontinye fè apèl API pwoteje pandan plizyè minit.
* **Koreksyon nesesè :** Rele 	oken_blacklist imedyatman sou tout sesyon aktif itilizatè a nan tab UserSession depi sispansyon an fèt.

### B. Stockaj Jeton nan sessionStorage / localStorage
* **Konsta :** Jeton admin ault_token ak jeton itilizatè yo estoke nan sessionStorage ak localStorage.
* **Risk :** Si yon atakè ta rive eksplwate yon fay XSS nan yon kòmantè oswa yon deskripsyon videyo, li ka vòlè jeton sa yo.
* **Koreksyon nesesè :** Migre sou bonjan Cookies HttpOnly; SameSite=Strict; Secure.

### C. Permissions AllowAny sou Endpoint Vault yo
* **Konsta :** Endpoint tankou ault_user_change_status_view, ault_user_reset_password_view, ak ault_user_merge_view itilize @permission_classes([AllowAny]) epi repose sèlman sou fonksyon enforce_vault_security(request).
* **Risk :** Yo pa tcheke si moun nan se yon vrè is_superuser oswa is_staff ki konekte nan sesyon Django a.
* **Koreksyon nesesè :** Makonnen sekirite token Vault la ak pèmisyon natif Django IsAdminUser.

### D. Modpas Tanporè ki transmèt an klè sou rezo a
* **Konsta :** Endpoint ault_user_reset_password_view jenere yon modpas tanporè epi li voye l an repons JSON klè bay admin nan.
* **Risk :** Entèsepsyon oswa ekspoze modpas la sou ekran admin nan.
* **Koreksyon rekòmande :** Jenere yon jeton inik reinitialisation (PasswordResetToken) epi voye yon lyen pa email dirèkteman bay itilizatè a san admin nan pa janm wè modpas li.

---

## 4. 🔀 Konpòtman Modil Social nan X-Vault (Aplike kounye a)
* **Demann itilizatè a :** *le m switch nan module social anyen pa dwe paret, se mwen ki pral di w sa pou w fe*
* **Aksyon aplike :** Nan VaultRoot.tsx, nou konekte eta ctiveModule ki soti nan VaultModuleContext. Lè ctiveModule === 'social', fonksyon enderSection() retounen 
ull. Espas santral la rete konplètman blanch jiskaske ou bay enstriksyon sou kisa pou mete ladan l.

---

## 5. 🗄️ Pwoblèm Baz de Done, Konkirans & Travay nan Bakwonn

### A. Race Conditions sou Kontè Videyo (Vues, Likes)
* **Konsta :** Nan sèten pati nan ccueil/views.py, ogmantasyon kontè yo fèt sou fòm ideo.views += 1; video.save().
* **Risk :** Si 50 moun klike sou menm videyo a nan menm segonn nan, anpil klike ap pèdi paske requete yo ap ekri sou menm valè a.
* **Koreksyon nesesè :** Itilize F('views') + 1 ak update() atomik nan Django ORM.

### B. Levée de Sanction ki depann de vizit yon Admin
* **Konsta :** Fonksyon uto_lift_expired_suspensions() deklanche sèlman lè yon admin ouvri paj jesyon itilizatè yo.
* **Risk :** Si okenn admin pa konekte pandan yon wikenn, yon itilizatè ki te gen yon sispansyon 24 èdtan ap rete bloke pandan 3 jou.
* **Koreksyon nesesè :** Mete yon travay detache (cron oswa background scheduler) ki vire chak 5 a 10 minit pou leve sispansyon ki ekspire poukont li.

### C. Algorit Score Réputation & Complétion Profil ki estatik
* **Konsta :** Score réputation an fikse a 95 si itilizatè a aktif epi 40 si li inaktif. Pousantaj konplesyon pwofil la gade sèlman 4 kolòn bazik.
* **Koreksyon rekòmande :** Bati yon vrè fonksyon kalkil ki gade : ansyente kont lan, kantite rapò bèg rezoud, biyografi, foto, sètifika, ak aktivite pozitif.
