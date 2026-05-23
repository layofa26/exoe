import { useState, useEffect, useCallback } from 'react'
import type { BlockedUser, Report, ReportReason } from '../types/requests'
import { STORAGE_KEYS } from '../types/requests'

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useBlockedUsers = (currentUserId: string) => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [reports, setReports] = useState<Report[]>([])

  // Load from localStorage
  useEffect(() => {
    const savedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS)
    const savedReports = localStorage.getItem(STORAGE_KEYS.REPORTS)

    if (savedBlocked) {
      const allBlocked: BlockedUser[] = JSON.parse(savedBlocked)
      // Filter for current user only
      setBlockedUsers(allBlocked.filter(b => b.userId === currentUserId))
    }

    if (savedReports) {
      const allReports: Report[] = JSON.parse(savedReports)
      // Filter reports by or against current user
      setReports(allReports.filter(r => 
        r.reporterId === currentUserId || r.reportedId === currentUserId
      ))
    }
  }, [currentUserId])

  // Save to localStorage
  useEffect(() => {
    const savedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS)
    const allBlocked: BlockedUser[] = savedBlocked ? JSON.parse(savedBlocked) : []
    
    // Remove current user's old blocked entries
    const otherBlocked = allBlocked.filter(b => b.userId !== currentUserId)
    // Add current user's blocked list
    const newAllBlocked = [...otherBlocked, ...blockedUsers]
    
    localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(newAllBlocked))
  }, [blockedUsers, currentUserId])

  useEffect(() => {
    const savedReports = localStorage.getItem(STORAGE_KEYS.REPORTS)
    const allReports: Report[] = savedReports ? JSON.parse(savedReports) : []
    
    // Get IDs of current user's reports to avoid duplicates
    const currentUserReportIds = new Set(reports.map(r => r.id))
    const otherReports = allReports.filter(r => !currentUserReportIds.has(r.id))
    const newAllReports = [...otherReports, ...reports]
    
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(newAllReports))
  }, [reports])

  // Block a user
  const blockUser = useCallback((
    userToBlock: { id: string; name: string; avatar: string | null },
    reason?: string
  ) => {
    // Check if already blocked
    const alreadyBlocked = blockedUsers.some(b => b.userId === userToBlock.id)
    if (alreadyBlocked) {
      return { success: false, error: 'Cet utilisateur est déjà bloqué' }
    }

    const newBlockedUser: BlockedUser = {
      id: generateId(),
      userId: userToBlock.id,
      userName: userToBlock.name,
      userAvatar: userToBlock.avatar,
      blockedAt: new Date().toISOString(),
      reason
    }

    setBlockedUsers(prev => [newBlockedUser, ...prev])
    return { success: true }
  }, [blockedUsers])

  // Unblock a user
  const unblockUser = useCallback((blockedUserId: string) => {
    setBlockedUsers(prev => prev.filter(b => b.id !== blockedUserId))
    return { success: true }
  }, [])

  // Check if user is blocked
  const isBlocked = useCallback((userId: string) => {
    return blockedUsers.some(b => b.userId === userId)
  }, [blockedUsers])

  // Report a user
  const reportUser = useCallback((
    reportedUser: { id: string; name: string },
    reason: ReportReason,
    description?: string,
    requestId?: string,
    conversationId?: string
  ) => {
    const newReport: Report = {
      id: generateId(),
      reporterId: currentUserId,
      reportedId: reportedUser.id,
      requestId,
      conversationId,
      reason,
      description,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    setReports(prev => [newReport, ...prev])
    return { success: true }
  }, [currentUserId])

  // Get reports made by current user
  const myReports = useCallback(() => {
    return reports.filter(r => r.reporterId === currentUserId)
  }, [reports, currentUserId])

  // Get reports against current user
  const reportsAgainstMe = useCallback(() => {
    return reports.filter(r => r.reportedId === currentUserId)
  }, [reports, currentUserId])

  return {
    // Data
    blockedUsers,
    reports,
    blockedCount: blockedUsers.length,
    
    // Actions
    blockUser,
    unblockUser,
    isBlocked,
    reportUser,
    
    // Getters
    myReports,
    reportsAgainstMe
  }
}
