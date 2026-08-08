# Exemple de flux de conversation

## Étape 1 : Accepter une demande

1. Allez sur la page `/pro/requests`
2. Cliquez sur le bouton "Accepter" d'une demande en attente
3. Le système crée automatiquement une conversation et navigue vers `/pro/conversation/{id}`

## Étape 2 : Interface de conversation (style WhatsApp)

La conversation apparaît avec :
- **Header** : Avatar, nom de l'utilisateur, statut "En ligne"
- **Boutons header** : Retour, Recherche, Épingler, Archiver, Téléphone, Vidéo, Menu (⋮)
- **Messages** : Bulles de messages (bleu pour vous, blanc pour l'autre)
- **Input** : Zone de saisie avec boutons (pièce jointe, image, emoji, micro, envoyer)

## Étape 3 : Utiliser le menu caché (⋮)

1. Cliquez sur le bouton "⋮" (MoreVertical) en haut à droite
2. Le menu déroulant apparaît avec 3 options :
   - **Bloquer** (si non bloqué) : Empêche l'envoi de messages
   - **Restaurer** (si bloqué) : Réactive la conversation
   - **Supprimer définitivement** : Supprime la conversation

## Étape 4 : Confirmation des actions

Chaque action affiche une boîte de dialogue de confirmation :

### Bloquer
```
Bloquer cette conversation ?
Vous ne pourrez plus envoyer de messages à cet utilisateur.
[Annuler] [OK]
```

### Restaurer
```
Restaurer cette conversation ?
La conversation sera restaurée et vous pourrez envoyer des messages.
[Annuler] [OK]
```

### Supprimer définitivement
```
Supprimer définitivement cette conversation ?
Cette action est irréversible. Tous les messages seront supprimés.
[Annuler] [OK]
```

## Structure des données (localStorage)

### Request (exile_requests)
```json
{
  "id": "1",
  "senderId": "user1",
  "senderName": "Jean Dupont",
  "senderAvatar": null,
  "senderProfession": "Développeur",
  "receiverId": "current-user",
  "receiverName": "Vous",
  "receiverAvatar": null,
  "receiverProfession": "Professionnel",
  "message": "Bonjour, je souhaiterais collaborer avec vous.",
  "status": "accepted",
  "createdAt": "2024-05-24T10:00:00.000Z",
  "respondedAt": "2024-05-24T10:05:00.000Z"
}
```

### Conversation (exile_conversations)
```json
{
  "id": "conv-1716545100000",
  "requestId": "1",
  "participantIds": ["user1", "current-user"],
  "participantNames": ["Jean Dupont", "Vous"],
  "participantAvatars": [null, null],
  "messages": [
    {
      "id": "msg-1716545100000",
      "requestId": "1",
      "senderId": "user1",
      "senderName": "Jean Dupont",
      "content": "Bonjour, je souhaiterais collaborer avec vous.",
      "timestamp": "2024-05-24T10:00:00.000Z",
      "read": true
    }
  ],
  "lastMessageAt": "2024-05-24T10:05:00.000Z",
  "unreadCount": 0,
  "isPinned": false,
  "isArchived": false,
  "isBlocked": false
}
```

## Test rapide

1. Ouvrez la console du navigateur
2. Exécutez ce code pour créer une demande de test :

```javascript
const testRequest = {
  id: 'test-' + Date.now(),
  senderId: 'test-user',
  senderName: 'Utilisateur Test',
  senderAvatar: null,
  senderProfession: 'Testeur',
  receiverId: 'current-user',
  receiverName: 'Vous',
  receiverAvatar: null,
  receiverProfession: 'Professionnel',
  message: 'Ceci est un message de test.',
  status: 'pending',
  createdAt: new Date().toISOString()
}

const requests = JSON.parse(localStorage.getItem('exile_requests') || '[]')
requests.push(testRequest)
localStorage.setItem('exile_requests', JSON.stringify(requests))
```

3. Rafraîchissez la page `/pro/requests`
4. Acceptez la demande de test
5. Testez le menu et les actions de blocage/restauration/suppression
