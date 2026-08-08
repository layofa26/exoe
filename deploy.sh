#!/bin/bash

# Script de déploiement pour EXILE - Frontend et Backend
# Ce script déploie le frontend sur Vercel et le backend sur Render

echo "🚀 Début du déploiement EXILE..."

# Variables
FRONTEND_DIR="c:/pepe/exile-frontend/exile-frontend"
BACKEND_DIR="C:/yaml/EXILE_BACKEND/EXILE_BACKEND/EXILE_B"

# Étape 1: Déployer le Frontend (Vercel)
echo "📦 Déploiement du Frontend..."
cd "$FRONTEND_DIR"

# Installer les dépendances
echo "📥 Installation des dépendances frontend..."
npm install

# Build le frontend
echo "🔨 Build du frontend..."
npm run build

# Déployer sur Vercel (nécessite Vercel CLI installé)
# echo "🌐 Déploiement sur Vercel..."
# vercel --prod

echo "✅ Frontend prêt pour déploiement"

# Étape 2: Déployer le Backend (Render)
echo "📦 Déploiement du Backend..."
cd "$BACKEND_DIR"

# Installer les dépendances
echo "📥 Installation des dépendances backend..."
python -m pip install -r requirements.txt

# Exécuter les migrations
echo "🗄️ Exécution des migrations..."
python manage.py migrate

# Collecter les fichiers statiques
echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --noinput

# Déployer sur Render (nécessite Render CLI ou git push)
# echo "🌐 Déploiement sur Render..."
# git push origin main

echo "✅ Backend prêt pour déploiement"

echo "🎉 Déploiement terminé!"
echo ""
echo "📝 Instructions manuelles:"
echo "1. Frontend: Exécuter 'vercel --prod' dans $FRONTEND_DIR"
echo "2. Backend: Pusher sur git main branch pour déclencher Render"
echo ""
echo "🔗 URLs:"
echo "Frontend: https://exile-frontend.vercel.app"
echo "Backend: https://exile-16qm.onrender.com"
