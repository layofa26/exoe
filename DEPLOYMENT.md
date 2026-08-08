# Guide de Déploiement EXILE

## 📋 Prérequis

- Node.js (v18+)
- Python (v3.9+)
- Vercel CLI (pour frontend)
- Compte Render (pour backend)
- Git

## 🚀 Déploiement Frontend (Vercel)

### 1. Installation Vercel CLI
```bash
npm install -g vercel
```

### 2. Build du projet
```bash
cd c:/pepe/exile-frontend/exile-frontend
npm install
npm run build
```

### 3. Déploiement
```bash
vercel --prod
```

### 4. Configuration Environment Variables sur Vercel
- `VITE_API_BASE_URL`: https://exile-16qm.onrender.com/api
- `VITE_APP_URL`: https://exile-frontend.vercel.app
- `VITE_JITSI_DOMAIN`: meet.jit.si
- `VITE_SUPABASE_URL`: https://gbermbfhuajpguipyjfc.supabase.co
- `VITE_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## 🚀 Déploiement Backend (Render)

### 1. Configuration du projet sur Render
1. Connecter votre compte GitHub à Render
2. Créer un nouveau "Web Service"
3. Connecter le repository du backend
4. Configurer les variables d'environnement

### 2. Variables d'environnement Render
- `SECRET_KEY`: [Clé secrète forte]
- `DATABASE_URL`: [URL de base de données PostgreSQL]
- `DEBUG`: False
- `ALLOWED_HOSTS`: exile-16qm.onrender.com
- `CORS_ALLOWED_ORIGINS`: https://exile-frontend.vercel.app
- `CSRF_TRUSTED_ORIGINS`: https://exile-frontend.vercel.app

### 3. Build Command
```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4. Start Command
```bash
gunicorn EXILE_B.wsgi:application
```

## 🔒 Sécurité en Production

### Backend (Django)
- ✅ CORS configuré avec origines autorisées
- ✅ HTTPS/HSTS activé
- ✅ httpOnly cookies pour JWT
- ✅ Rate limiting global
- ✅ Rate limiting login
- ✅ Validation mot de passe

### Frontend (React)
- ✅ Timeout sur les requêtes API
- ✅ Validation mot de passe renforcée
- ✅ Rate limiting client
- ✅ Messages d'erreur génériques
- ✅ Sanitization inputs
- ✅ Validation schémas Zod

## 🧪 Tests de Production

### 1. Test de connexion
```bash
curl -X POST https://exile-16qm.onrender.com/api/v1/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### 2. Test d'inscription
```bash
curl -X POST https://exile-16qm.onrender.com/api/v1/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"Test123!","birth_date":"2000-01-01","profession":"Developer"}'
```

### 3. Test CORS
```bash
curl -X OPTIONS https://exile-16qm.onrender.com/api/v1/users/login/ \
  -H "Origin: https://exile-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

## 📊 Monitoring

### Backend
- Logs: Dashboard Render
- Métriques: Dashboard Render
- Base de données: Dashboard PostgreSQL

### Frontend
- Logs: Dashboard Vercel
- Analytics: Vercel Analytics
- Performance: Lighthouse

## 🔄 Mises à jour

### Frontend
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel déploie automatiquement
```

### Backend
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render déploie automatiquement
```

## 🆘 Dépannage

### Erreur CORS
- Vérifier `CORS_ALLOWED_ORIGINS` dans settings.py
- Vérifier `CSRF_TRUSTED_ORIGINS`
- Vérifier que l'URL frontend est correcte

### Erreur JWT
- Vérifier que `SIMPLE_JWT` settings sont corrects
- Vérifier que `SECRET_KEY` est le même
- Vérifier que les cookies sont httpOnly

### Erreur Database
- Vérifier `DATABASE_URL`
- Exécuter `python manage.py migrate`
- Vérifier les logs Render

## 📞 Support

- Backend: https://exile-16qm.onrender.com
- Frontend: https://exile-frontend.vercel.app
- Documentation: /docs
