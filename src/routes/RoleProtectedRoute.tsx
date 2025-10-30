import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAccount } from '../hooks/use-account'
import type { UserRole } from '../types'

type RoleProtectedRouteProps = {
    children: ReactNode
    allowedRoles: UserRole[]
}

export function RoleProtectedRoute({
    children,
    allowedRoles,
}: RoleProtectedRouteProps) {
    const { role } = useAccount()

    if (!role || !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}


