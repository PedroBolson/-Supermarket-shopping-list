import { useAccount } from './use-account'
import type { PlanLimits, AccountMetrics } from '../types'

export function usePlanLimits() {
    const { account } = useAccount()

    const limits: PlanLimits | null = account?.limits ?? null
    const metrics: AccountMetrics | null = account?.metrics ?? null

    const membersUsage = metrics && limits
        ? {
            current: metrics.currentMembers,
            max: limits.maxMembers,
            percentage: (metrics.currentMembers / limits.maxMembers) * 100,
            isAtLimit: metrics.currentMembers >= limits.maxMembers,
            remaining: limits.maxMembers - metrics.currentMembers,
        }
        : null

    const listsUsage = metrics && limits
        ? {
            current: metrics.currentLists,
            max: limits.maxLists,
            percentage: (metrics.currentLists / limits.maxLists) * 100,
            isAtLimit: metrics.currentLists >= limits.maxLists,
            remaining: limits.maxLists - metrics.currentLists,
        }
        : null

    const storageUsage = metrics && limits
        ? {
            current: metrics.currentStorageMB,
            max: limits.maxStorageMB,
            percentage: (metrics.currentStorageMB / limits.maxStorageMB) * 100,
            isAtLimit: metrics.currentStorageMB >= limits.maxStorageMB,
            remaining: limits.maxStorageMB - metrics.currentStorageMB,
        }
        : null

    const canAddMember = membersUsage ? !membersUsage.isAtLimit : false
    const canAddList = listsUsage ? !listsUsage.isAtLimit : false
    const hasStorageSpace = storageUsage ? !storageUsage.isAtLimit : false

    const hasAnyLimitReached =
        membersUsage?.isAtLimit ||
        listsUsage?.isAtLimit ||
        storageUsage?.isAtLimit

    return {
        limits,
        metrics,
        membersUsage,
        listsUsage,
        storageUsage,
        canAddMember,
        canAddList,
        hasStorageSpace,
        hasAnyLimitReached,
    }
}

export type UsePlanLimitsReturn = ReturnType<typeof usePlanLimits>


