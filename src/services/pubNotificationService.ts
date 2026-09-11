import { notificationService, type AppNotification } from './notificationService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://exile-backend-9q6o.onrender.com/api/v1' : 'http://localhost:8000/api/v1')

export type PubNotificationType = 
  | 'inquiry_received'   // Demande reçue
  | 'campaign_active'    // Campagne validée et active
  | 'campaign_paused'    // Campagne mise en pause
  | 'campaign_resumed'   // Campagne réactivée
  | 'campaign_ended'     // Campagne arrivée à échéance
  | 'milestone_clicks'   // Nouveau palier de clics

interface PubNotificationPayload {
  type: PubNotificationType
  brandName: string
  adId?: string
  inquiryId?: string
  userUuid?: string
  endDate?: string
  clicks?: number
}

export const triggerPubNotification = (payload: PubNotificationPayload): void => {
  const platformLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('exile_pub_platform_logo') || '' : ''

  let title = 'Espace Entreprise (PUB)'
  let message = ''
  let actionButton: { label: string; actionUrl: string } | undefined = undefined

  switch (payload.type) {
    case 'inquiry_received':
      title = 'Demande Publicitaire reçue 📩'
      message = `Votre demande pour "${payload.brandName}" a été transmise avec succès à l'équipe PUB EXILE. Vous serez notifié dès activation.`
      break

    case 'campaign_active':
      title = '🚀 Campagne Publicitaire Active !'
      message = `Félicitations ! Votre publicité "${payload.brandName}" est maintenant active et diffusée auprès de tous les utilisateurs.`
      actionButton = {
        label: 'Voir dans le feed',
        actionUrl: '/pro'
      }
      break

    case 'campaign_paused':
      title = 'Campagne en pause ⏸️'
      message = `La diffusion de la publicité "${payload.brandName}" a été temporairement suspendue.`
      break

    case 'campaign_resumed':
      title = 'Campagne réactivée ▶️'
      message = `La diffusion de la publicité "${payload.brandName}" a repris avec succès dans le feed.`
      break

    case 'campaign_ended':
      title = 'Campagne Publicitaire terminée ⏰'
      message = `Votre publicité "${payload.brandName}" est arrivée à sa date de fin (${payload.endDate || 'échue'}). Elle n'est plus diffusée dans le feed.`
      actionButton = {
        label: 'Faire encore une demande',
        actionUrl: '/pub/demande'
      }
      break

    case 'milestone_clicks':
      title = 'Nouveau succès d\'audience 📈'
      message = `Votre publicité "${payload.brandName}" vient d'atteindre ${payload.clicks} clics vérifiés !`
      break
  }

  // 1. Déclencher via le service local
  const notif = notificationService.notify({
    type: 'system',
    title,
    message,
    iconUrl: platformLogo || undefined,
    actionButton,
    data: {
      isPub: true,
      pubType: payload.type,
      adId: payload.adId,
      actionButton
    }
  })

  // 2. Émettre les événements globaux
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('exile_notification_added', { detail: notif }))
    window.dispatchEvent(new CustomEvent('exile_notifications_updated'))
    window.dispatchEvent(new Event('storage'))

    // 3. Déclencher une Notification Push Native Système Réelle (Mobiles & Ordinateur)
    sendNativePushNotification(title, message, platformLogo, actionButton?.actionUrl)
  }

  // 4. Synchroniser avec le serveur backend
  fetch(`${API_BASE_URL}/pub/annonces/notifications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notification: notif,
      user_uuid: payload.userUuid
    })
  }).catch(() => {})
}

// ─────────────────────────────────────────────────────────────
// 📱 NOTIFICATIONS PUSH NATIVES RÉELLES (MOBILES, ANDROID & HORS-LIGNE)
// ─────────────────────────────────────────────────────────────

export const requestPushNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission()
      return perm === 'granted'
    } catch {
      return false
    }
  }
  return false
}

export const sendNativePushNotification = async (
  title: string,
  message: string,
  iconUrl?: string,
  actionUrl?: string
): Promise<void> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  // Demander la permission si nécessaire
  if (Notification.permission !== 'granted') {
    if (Notification.permission !== 'denied') {
      const granted = await requestPushNotificationPermission()
      if (!granted) return
    } else {
      return
    }
  }

  const icon = iconUrl || '/favicon.ico'
  const options = {
    body: message,
    icon,
    badge: icon,
    tag: `exile_pub_${Date.now()}`,
    vibrate: [200, 100, 200],
    data: { url: actionUrl || '/pro' }
  }

  // Utiliser le Service Worker pour affichage hors-ligne / en arrière-plan
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options)
        return
      }
    } catch {}
  }

  // Fallback Notification Web API
  try {
    const notif = new Notification(title, options)
    notif.onclick = () => {
      window.focus()
      if (actionUrl) window.location.href = actionUrl
      notif.close()
    }
  } catch {}
}

export const syncRemotePubNotifications = async (): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/pub/annonces/notifications/`)
    if (res.ok) {
      const serverNotifs = await res.json()
      if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
        const local = JSON.parse(localStorage.getItem('exile_notifications') || '[]')
        const mergedMap = new Map<string, any>()
        local.forEach((n: any) => mergedMap.set(n.id, n))
        serverNotifs.forEach((n: any) => {
          if (!mergedMap.has(n.id)) mergedMap.set(n.id, n)
        })
        const merged = Array.from(mergedMap.values()).slice(0, 50)
        localStorage.setItem('exile_notifications', JSON.stringify(merged))
        window.dispatchEvent(new CustomEvent('exile_notifications_updated'))
      }
    }
  } catch {}
}
