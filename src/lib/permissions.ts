import { useAppSelector } from '@/store/hooks';
import { AdminModule, AdminAction } from '@/types/admin';

/**
 * Hook to check if the current admin has specific permissions
 */
export function usePermissions() {
  const { admin } = useAppSelector(state => state.auth);
  const { admins, roles } = useAppSelector(state => state.adminState);

  const hasPermission = (module: AdminModule, action: AdminAction = 'view'): boolean => {
    if (!admin) return false;

    // Find the current admin user to get their roleId
    // If not found in our managed admins list (e.g. legacy fallback), we default to full access if they are admin-1, else none.
    let roleId = 'role_super_admin'; // fallback
    const currentAdminUser = admins.find(a => a.email === admin.email);
    
    if (currentAdminUser) {
      roleId = currentAdminUser.roleId;
    } else if (admin.id !== 'admin-1') {
      return false; 
    }

    const role = roles.find(r => r.id === roleId);
    if (!role) return false;

    const modulePermissions = role.permissions[module];
    if (!modulePermissions) return false;

    return modulePermissions.includes(action);
  };

  return { hasPermission };
}
