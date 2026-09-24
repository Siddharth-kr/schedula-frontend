"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addAdminUser, updateAdminUser } from "@/store/slices/adminSlice";
import { addAuditLog } from "@/store/slices/auditSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminPagination } from "./AdminPagination";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { usePermissions } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { AdminUser, AdminRole } from "@/types/admin";

export function AdminUsersClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('Admin Users', 'create');
  const canEdit = hasPermission('Admin Users', 'edit');

  const admins = useAppSelector((state) => state.adminState.admins);
  const roles = useAppSelector((state) => state.adminState.roles);
  const currentUser = useAppSelector((state) => state.auth.admin);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("lastActive");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "", // Only for add
    roleId: roles[0]?.id || "",
    status: "active" as "active" | "inactive"
  });

  useEffect(() => {
    setIsClient(true); // eslint-disable-line
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredAdmins = useMemo(() => {
    const result = admins.filter((admin) => {
      const matchesSearch = 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || admin.roleId === roleFilter;
      const matchesStatus = statusFilter === "all" || admin.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "joined") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // lastActive
        const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return timeB - timeA;
      }
    });

    return result;
  }, [admins, searchTerm, roleFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedAdmins = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredAdmins.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAdmins, validCurrentPage, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("lastActive");
    setCurrentPage(1);
  };

  const openAddModal = () => {
    if (!canCreate) return;
    setFormMode("add");
    setFormData({
      name: "",
      email: "",
      password: "",
      roleId: roles[0]?.id || "",
      status: "active"
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    if (!canEdit) return;
    setFormMode("edit");
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "", // passwords not loaded or edited here directly
      roleId: admin.roleId,
      status: admin.status
    });
    setIsFormModalOpen(true);
  };

  const openViewModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setIsViewModalOpen(true);
  };

  const handleFormSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (formMode === "add") {
      if (!formData.password.trim()) {
        toast.error("Password is required for new admins.");
        return;
      }
      const newAdmin: AdminUser = {
        id: `admin_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };
      dispatch(addAdminUser(newAdmin));
      dispatch(addAuditLog({
        admin: currentUser?.name || "System",
        action: "Create Admin",
        entity: "Admin Users",
        details: `Created new admin user: ${newAdmin.name}`
      }));
      toast.success("Admin user created successfully.");
    } else if (formMode === "edit" && selectedAdmin) {
      const updatedAdmin: AdminUser = {
        ...selectedAdmin,
        name: formData.name,
        email: formData.email,
        roleId: formData.roleId,
        status: formData.status,
      };
      dispatch(updateAdminUser(updatedAdmin));
      dispatch(addAuditLog({
        admin: currentUser?.name || "System",
        action: "Update Admin",
        entity: "Admin Users",
        details: `Updated admin user: ${updatedAdmin.name}`
      }));
      toast.success("Admin user updated successfully.");
    }

    setIsFormModalOpen(false);
  };

  const handleToggleStatus = (admin: AdminUser) => {
    if (!canEdit) return;
    
    if (admin.email === currentUser?.email) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    const newStatus = admin.status === "active" ? "inactive" : "active";
    const updatedAdmin: AdminUser = { ...admin, status: newStatus };
    dispatch(updateAdminUser(updatedAdmin));
    dispatch(addAuditLog({
      admin: currentUser?.name || "System",
      action: "Toggle Admin Status",
      entity: "Admin Users",
      details: `Changed status of ${admin.name} to ${newStatus}`
    }));
    toast.success(`Admin user ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || "Unknown Role";
  };

  const getRoleBadgeStyle = (roleName: string) => {
    if (roleName.toLowerCase().includes('super admin')) return "bg-purple-100 text-purple-700 border-purple-200";
    if (roleName.toLowerCase().includes('admin')) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };
  
  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700"];
    let sum = 0;
    for(let i=0; i<name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    if (diffInMs < 60000) return "Just now";
    
    const diffInMins = Math.floor(diffInMs / 60000);
    if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: "checkbox",
      title: "",
      render: () => <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />,
      className: "w-10",
    },
    {
      key: "admin",
      title: "Admin",
      render: (admin) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${getAvatarColor(admin.name)}`}>
            {getInitials(admin.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-slate-900 truncate">{admin.name}</span>
            <span className="text-[13px] text-slate-500 truncate">{admin.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      render: (admin) => {
        const roleName = getRoleName(admin.roleId);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold border ${getRoleBadgeStyle(roleName)}`}>
            {roleName.toLowerCase().includes('super') ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ) : roleName.toLowerCase().includes('support') ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            )}
            {roleName}
          </span>
        );
      }
    },
    {
      key: "status",
      title: "Status",
      render: (admin) => (
        <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-semibold border ${
          admin.status === 'active' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {admin.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "lastActive",
      title: "Last Active",
      render: (admin) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          <span className="text-[13px] font-medium text-slate-700">{formatRelativeTime(admin.lastActive)}</span>
        </div>
      ),
    },
    {
      key: "joinedOn",
      title: "Joined On",
      render: (admin) => (
        <span className="text-[13px] font-medium text-slate-700">
          {admin.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(admin.createdAt)) : "Not available"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (admin) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openViewModal(admin)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
          
          {canEdit && (
            <>
              <button
                onClick={() => openEditModal(admin)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              
              <div className="relative group">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                  <button
                    onClick={() => handleToggleStatus(admin)}
                    className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                      admin.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )
    }
  ];

  if (!isClient || isLoading) return <AdminPageSkeleton />;

  // Calculated Stats
  const activeCount = admins.filter(a => a.status === 'active').length;
  const inactiveCount = admins.filter(a => a.status === 'inactive').length;
  const activePercentage = admins.length > 0 ? Math.round((activeCount / admins.length) * 100) : 0;
  const inactivePercentage = admins.length > 0 ? Math.round((inactiveCount / admins.length) * 100) : 0;
  
  // Count distinct configured roles used by users
  const usedRoles = new Set(admins.map(a => a.roleId)).size;
  const roleNames = Array.from(new Set(admins.map(a => getRoleName(a.roleId))));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
            <span>Home</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900 font-medium">Admin Users</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Users</h1>
          <p className="text-[15px] text-slate-500 mt-1">Manage portal access, administrative roles and permissions.</p>
        </div>
        {canCreate && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap text-[14px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Admin
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">Total Admins</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{admins.length}</p>
            </div>
            <p className="text-[12px] text-slate-400">All administrator accounts</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="w-full">
              <p className="text-[13px] font-medium text-slate-500 mb-0.5">Active Admins</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{activeCount}</p>
              <div className="flex items-center justify-between mt-3 w-full gap-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activePercentage}%` }}></div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{activePercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="w-full">
              <p className="text-[13px] font-medium text-slate-500 mb-0.5">Inactive Admins</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{inactiveCount}</p>
              <div className="flex items-center justify-between mt-3 w-full gap-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${inactivePercentage}%` }}></div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">{inactivePercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">Roles</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{usedRoles}</p>
            <p className="text-[12px] text-slate-400 line-clamp-1" title={roleNames.join(", ")}>
              {roleNames.join(", ") || "No roles assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            <div className="w-full xl:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder="Search by name, email or role..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full h-10 pl-9 pr-4 text-[13px] text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide hidden md:inline-block">Role</span>
                  <select 
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-[140px] h-10 px-3 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="all">All Roles</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide hidden md:inline-block">Status</span>
                  <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-[140px] h-10 px-3 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide hidden md:inline-block">Sort By</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-[140px] h-10 px-3 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 shadow-sm transition-all"
                  >
                    <option value="lastActive">Last Active</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="joined">Joined Date</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleReset}
                className="h-10 px-4 flex items-center justify-center gap-2 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm w-full sm:w-auto"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="w-full overflow-x-auto">
          {filteredAdmins.length > 0 ? (
            <>
              <AdminTable data={paginatedAdmins} columns={columns} keyExtractor={(a) => a.id} />
              
              <div className="p-4 lg:p-5 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
                <div className="text-[13px] font-medium text-slate-500">
                  Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredAdmins.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredAdmins.length)} of {filteredAdmins.length} admins
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-slate-500">per page</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="h-9 px-2 text-[13px] text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  <AdminPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="p-16">
              <AdminEmptyState
                title="No admin users found"
                description="Try adjusting your search or filter criteria to find what you're looking for."
                icon={
                  <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                action={
                  <button onClick={handleReset} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-100 transition-colors">
                    Reset Filters
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <AdminModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === "add" ? "Add Admin User" : "Edit Admin User"}
      >
        <div className="space-y-5 p-1">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. Sarah Jenkins"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="sarah@schedula.com"
            />
          </div>

          {formMode === "add" && (
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Initial Password <span className="text-red-500">*</span></label>
              <input 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Required for first login"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Role <span className="text-red-500">*</span></label>
              <select 
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Account Status <span className="text-red-500">*</span></label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-5 mt-2 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[14px] font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleFormSubmit}
              className="px-5 py-2.5 bg-blue-600 text-white text-[14px] font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {formMode === "add" ? "Create Admin" : "Save Changes"}
            </button>
          </div>
        </div>
      </AdminModal>

      {/* View Details Modal */}
      <AdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Admin Details"
      >
        {selectedAdmin && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${getAvatarColor(selectedAdmin.name)}`}>
                {getInitials(selectedAdmin.name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAdmin.name}</h3>
                <p className="text-[14px] text-slate-500">{selectedAdmin.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadgeStyle(getRoleName(selectedAdmin.roleId))}`}>
                    {getRoleName(selectedAdmin.roleId)}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${selectedAdmin.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {selectedAdmin.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                <p className="text-[14px] font-medium text-slate-900">
                  {selectedAdmin.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(selectedAdmin.createdAt)) : "Not available"}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Active</p>
                <p className="text-[14px] font-medium text-slate-900">{formatRelativeTime(selectedAdmin.lastActive)}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-[14px] font-medium text-slate-900">{selectedAdmin.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admin ID</p>
                <p className="text-[13px] font-medium text-slate-500 font-mono">{selectedAdmin.id}</p>
              </div>
            </div>

            <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-[14px] font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>

    </div>
  );
}
