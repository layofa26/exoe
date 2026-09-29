import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function EventPreview() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (eventId) {
      const cleanId = String(eventId).replace('exile-', '').replace('evt_', '')
      navigate(`/pro?event=${cleanId}&from=${encodeURIComponent('/pro/events')}`, { replace: true })
    } else {
      navigate('/pro', { replace: true })
    }
  }, [eventId, navigate])

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
    </div>
  )
}
