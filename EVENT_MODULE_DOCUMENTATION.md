# 📅 Documentation Module Événements - EXILE Platform

## 📁 Structure des Fichiers

### 1. Types et Définitions
| Fichier | Chemin | Rôle |
|---------|--------|------|
| `events.ts` | `src/types/events.ts` | Définitions TypeScript pour Event, Ticket, LiveChat, etc. |

### 2. Pages Principales (Routes)
| Fichier | Chemin | Rôle |
|---------|--------|------|
| `EventsPro.tsx` | `src/pages/ModuleProfessional/EventsPro.tsx` | **Page "Mes Événements"** - Liste des événements créés par l'utilisateur |
| `EventDiscovery.tsx` | `src/pages/ModuleProfessional/EventDiscovery.tsx` | **Page "Découvrir"** - Liste publique de tous les événements |
| `LiveRoom.tsx` | `src/pages/ModuleProfessional/LiveRoom.tsx` | **Page Live** - Salle de diffusion en direct avec chat |
| `EventRegistration.tsx` | `src/pages/ModuleProfessional/EventRegistration.tsx` | **Page Inscription** - Formulaire d'inscription à un événement |

### 3. Modals et Composants
| Fichier | Chemin | Rôle |
|---------|--------|------|
| `CreateEventModal.tsx` | `src/components/modals/CreateEventModal.tsx` | **Modal Création** - Formulaire 5 étapes (Info, Date, Billets, Visuel, Aperçu) |
| `EventRegistrationModal.tsx` | `src/components/modals/EventRegistrationModal.tsx` | **Modal Inscription** - S'inscrire à un événement |
| `EventsPublic.tsx` | `src/components/EventsPublic.tsx` | **Liste Publique** - Affichage des événements publics |
| `EventDetailModal.tsx` | `src/components/modals/EventDetailModal.tsx` | **Modal Détail** - Voir les détails d'un événement |

### 4. Services et Données
| Fichier | Chemin | Rôle |
|---------|--------|------|
| `eventService.ts` | `src/services/eventService.ts` | **Service Événements** - CRUD, chargement, sauvegarde localStorage |
| `liveService.ts` | `src/services/liveService.ts` | **Service Live** - Jitsi Meet, chat, modération |

### 5. Routage (Navigation)
| Fichier | Chemin | Rôle |
|---------|--------|------|
| `App.tsx` | `src/App.tsx` | Définition des routes `/pro/events/*` |

---

## 🛠 Stack Technologique

### Frontend:
- **React 18** + TypeScript (strict mode)
- **React Router v6** - Navigation
- **TailwindCSS** - Styling
- **Lucide React** - Icônes
- **Jitsi Meet SDK** - Live streaming
- **localStorage** - Stockage données locales (MVP)

### Configuration:
- **Vite** - Build tool
- **ESLint** - Linting
- **TypeScript** - Type checking strict

---

## 📊 Structure des Données (TypeScript)

### Événement Principal
```typescript
interface Event {
  id: string                    // UUID unique
  title: string                 // Titre (obligatoire)
  summary?: string             // Résumé court
  description?: string       // Description détaillée
  type: EventType            // 'workshop' | 'conference' | 'networking' | etc.
  category: EventCategory    // 'business' | 'technology' | 'arts' | etc.
  status: EventStatus        // 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  
  // Date & Heure
  startDate: string          // Format: "2026-04-30"
  startTime: string          // Format: "14:00"
  endDate?: string           // Optionnel
  endTime?: string           // Optionnel
  timezone: string           // Ex: "America/Port-au-Prince"
  
  // Format & Lieu
  format: EventFormat        // 'in-person' | 'online' | 'hybrid'
  location: EventLocation    // { venue, address, city, country, coordinates }
  virtualLink?: string       // Lien Zoom/Meet/Jitsi
  
  // Capacité & Billets
  capacity: number           // Capacité totale
  ticketTiers: TicketTier[]  // Niveaux de billets
  
  // Médias
  coverImage?: string        // URL image de couverture
  gallery?: string[]         // URLs images additionnelles
  
  // Live Streaming
  streaming?: StreamingConfig
  
  // Organisateur
  organizerId: string        // ID utilisateur créateur
  organizerName?: string     // Nom affiché
  organizerAvatar?: string   // URL avatar
  
  // Métadonnées
  tags: string[]             // Mots-clés (max 10)
  visibility: 'public' | 'private' | 'unlisted'
  createdAt: string
  updatedAt: string
}
```

### Niveaux de Billets
```typescript
interface TicketTier {
  id: string                 // UUID
  name: string               // "Early Bird", "Standard", "VIP"
  description?: string       // Description du billet
  price: number              // Prix en EUR (0 = gratuit)
  quantity: number           // Nombre de billets disponibles
  maxPerOrder: number        // Max par commande
  benefits: string[]         // Avantages inclus
  isEarlyBird?: boolean      // Tarif préférentiel
  endDate?: string           // Date fin Early Bird
  saleStartDate?: string     // Début des ventes
  saleEndDate?: string       // Fin des ventes
}
```

### Configuration Live Streaming
```typescript
interface StreamingConfig {
  platform: 'jitsi' | 'zoom' | 'teams' | 'youtube' | 'facebook' | 'custom'
  roomId?: string            // ID room Jitsi
  url?: string               // URL directe
  isLive: boolean           // En direct maintenant?
  enableChat: boolean       // Chat activé?
  enableQA: boolean         // Q&A activé?
  enablePolls: boolean      // Sondages activés?
  recordingEnabled: boolean // Enregistrement?
  autoStart: boolean        // Démarrage auto?
}
```

### Chat en Direct
```typescript
interface LiveChatMessage {
  id: string
  eventId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: string        // ISO 8601
  type: 'text' | 'moderator' | 'system' | 'question' | 'pinned'
  pinned?: boolean
  reactions?: { emoji: string; count: number; users: string[] }[]
}

interface RoomModeration {
  mutedUsers: string[]       // IDs utilisateurs mutés
  kickedUsers: string[]      // IDs utilisateurs expulsés
  coHosts: string[]         // IDs co-animateurs
  chatEnabled: boolean
  qaMode: boolean           // Mode Questions/Réponses
  recordingEnabled: boolean
}
```

### Inscription
```typescript
interface EventRegistration {
  id: string
  eventId: string
  userId: string
  ticketTierId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended'
  registrationDate: string
  checkInDate?: string
  paymentStatus?: 'pending' | 'completed' | 'refunded'
  paymentAmount?: number
  qrCode?: string           // Pour scan entrée
}
```

---

## 🛣 Routage (URLs)

| URL | Page | Permission | Description |
|-----|------|------------|-------------|
| `/pro/events` | **Mes Événements** | Connecté | Dashboard avec stats, liste des événements créés |
| `/pro/events/discover` | **Découvrir** | Public | Explorer tous les événements publics |
| `/pro/live/:eventId` | **Live Room** | Inscrit ou Hôte | Salle de streaming avec chat, Q&A, polls |
| `/pro/events/register/:eventId` | **Inscription** | Connecté | Formulaire d'inscription avec paiement |

---

## 🎨 Design System

### Couleurs Principales
```
Primary:    #3B82F6 (bleu)
Secondary:  #8B5CF6 (violet)
Success:    #10B981 (vert)
Warning:    #F59E0B (orange)
Danger:     #EF4444 (rouge)
Live:       #EF4444 (rouge vif pour badge LIVE)
```

### Composants UI
- **Stepper**: 5 étapes avec progression visuelle
- **Cards**: Avec badges (LIVE, Présentiel, Virtuel, Hybrid)
- **Modal**: Overlay avec animation, fermeture sur Escape/click extérieur
- **Forms**: Validation inline, erreurs en rouge sous champs
- **Chat**: Interface type Twitch/YouTube avec messages flottants

---

## 🔧 Fonctionnalités Clés

### 1. Création d'Événement (5 Étapes)
1. **Informations** : Titre, description, catégorie, tags
2. **Date & Lieu** : Date/heure, timezone, format, adresse
3. **Billets** : Early Bird, Standard, VIP avec avantages
4. **Visuel** : Upload image couverture, visibilité
5. **Aperçu** : Récapitulatif avant publication

### 2. Système de Billets
- 3 niveaux par défaut : Early Bird, Standard, VIP
- Configuration prix, quantité, bénéfices
- Limitation par commande
- Dates de vente

### 3. Live Streaming (Jitsi)
- Intégration Jitsi Meet
- Chat en direct avec modération
- Mode Q&A (Questions/Réponses)
- Sondages en direct
- Réactions emoji
- Enregistrement

### 4. Modération
- Mute utilisateurs
- Kick/Ban utilisateurs
- Épingler messages
- Mode slow
- Approbation questions (Q&A)

---

## 💾 Stockage Données

### localStorage Keys
```
exile_events_{userId}           - Liste événements utilisateur
exile_event_registrations       - Inscriptions
exile_chat_{eventId}            - Messages chat
exile_moderation_{eventId}      - Paramètres modération
exile_polls_{eventId}           - Sondages
```

---

## 🚨 Contraintes & Règles

### Validation Événement
- **Titre** : Min 5 caractères, max 200
- **Description** : Optionnelle, max 5000 caractères
- **Date début** : Obligatoire, doit être dans le futur
- **Heure début** : Obligatoire
- **Capacité** : Min 1, max 100000
- **Tags** : Max 10, min 2 caractères chacun

### Validation Billets
- **Prix** : Min 0 (gratuit), max 10000 EUR
- **Quantité** : Min 1 par niveau
- **Total** : Somme des billets ≤ capacité

### Sécurité
- Seul l'organisateur peut modérer son live
- Seul l'organisateur peut éditer/supprimer l'événement
- Inscription requise pour rejoindre un live (sauf hôte)

---

## 🎯 Constantes

### Catégories d'Événements
```typescript
const EVENT_CATEGORIES = [
  { id: 'business', label: 'Business & Entreprise', icon: Briefcase },
  { id: 'technology', label: 'Technologie', icon: Cpu },
  { id: 'arts', label: 'Arts & Culture', icon: Palette },
  { id: 'education', label: 'Éducation', icon: GraduationCap },
  { id: 'health', label: 'Santé & Bien-être', icon: Heart },
  { id: 'social', label: 'Social & Networking', icon: Users },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Divertissement', icon: Music },
  { id: 'other', label: 'Autre', icon: Tag }
]
```

### Types d'Événements
```typescript
const EVENT_TYPES = [
  { id: 'workshop', label: 'Atelier/Formation', icon: Wrench },
  { id: 'conference', label: 'Conférence', icon: Mic },
  { id: 'webinar', label: 'Webinaire', icon: Video },
  { id: 'networking', label: 'Networking', icon: Users },
  { id: 'meetup', label: 'Meetup', icon: Coffee },
  { id: 'seminar', label: 'Séminaire', icon: BookOpen },
  { id: 'panel', label: 'Panel Discussion', icon: MessageSquare },
  { id: 'class', label: 'Cours', icon: GraduationCap },
  { id: 'other', label: 'Autre', icon: HelpCircle }
]
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 640px (1 colonne, chat en drawer)
- **Tablet** : 640px - 1024px (2 colonnes)
- **Desktop** : > 1024px (3 colonnes, chat sidebar)

### Adaptations Mobile
- Stepper compact (titres cachés)
- Chat en bottom sheet
- Navigation simplifiée
- Upload image avec preview

---

## 🔗 API Endpoints (À Implémenter)

```
GET    /api/events              - Liste événements
GET    /api/events/:id          - Détail événement
POST   /api/events              - Créer événement
PUT    /api/events/:id          - Modifier événement
DELETE /api/events/:id          - Supprimer événement

POST   /api/events/:id/register - S'inscrire
POST   /api/live/:id/join       - Rejoindre live
POST   /api/live/:id/message    - Envoyer message chat
```

---

## 📝 Notes pour Développeur

### À Améliorer
1. Passer localStorage → vraie API backend
2. Ajouter paiement Stripe/PayPal
3. Intégration calendrier (Google/Outlook)
4. Notifications push
5. Analytics avancés
6. SEO optimization
7. PWA (Progressive Web App)

### Bugs Connus
- Aucun (dernière vérification : 2026-04-30)

---

**Dernière mise à jour** : 30 Avril 2026  
**Auteur** : EXILE Development Team  
**Version** : 1.0.0
