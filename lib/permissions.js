/**
 * PERMISSION SYSTEM
 * 
 * Role-Based Access Control (RBAC) for the dental SaaS platform.
 * Defines permissions for each role and provides utility functions.
 * 
 * IN CODEIGNITER:
 * Equivalent to application/config/permissions.php or a role-based auth library
 * 
 * USER ROLES:
 * - ADMIN: Full access to their clinic's resources
 * - DOCTOR: Can view/update patients, manage appointments and treatments
 * - RECEPTIONIST: Can manage patients, appointments, and invoices
 */

// =============================================================================
// PERMISSION CONSTANTS
// =============================================================================

export const PERMISSIONS = {
  // Patient Management
  PATIENTS: {
    VIEW: 'patients:view',
    CREATE: 'patients:create',
    UPDATE: 'patients:update',
    DELETE: 'patients:delete'
  },
  
  // Appointment Management
  APPOINTMENTS: {
    VIEW: 'appointments:view',
    CREATE: 'appointments:create',
    UPDATE: 'appointments:update',
    DELETE: 'appointments:delete'
  },
  
  // Treatment Records
  TREATMENTS: {
    VIEW: 'treatments:view',
    CREATE: 'treatments:create',
    UPDATE: 'treatments:update'
  },
  
  // Billing & Invoices
  INVOICES: {
    VIEW: 'invoices:view',
    CREATE: 'invoices:create',
    UPDATE: 'invoices:update',
    DELETE: 'invoices:delete'
  },
  
  // Doctor Management
  DOCTORS: {
    VIEW: 'doctors:view',
    CREATE: 'doctors:create',
    UPDATE: 'doctors:update',
    DELETE: 'doctors:delete'
  },
  
  // User Management (Staff)
  USERS: {
    VIEW: 'users:view',
    CREATE: 'users:create',
    UPDATE: 'users:update',
    DELETE: 'users:delete'
  },
  
  // Analytics & Reports
  ANALYTICS: {
    VIEW: 'analytics:view'
  },
  
  // Clinic Settings
  SETTINGS: {
    VIEW: 'settings:view',
    UPDATE: 'settings:update'
  }
}

// Get all permission values as a flat array
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).reduce((acc, category) => {
  return [...acc, ...Object.values(category)]
}, [])

// =============================================================================
// ROLE TO PERMISSIONS MAPPING
// =============================================================================

export const ROLE_PERMISSIONS = {
  /**
   * ADMIN - Clinic Administrator
   * Has full control over their clinic's resources.
   * Can manage staff, settings, and all patient data.
   */
  ADMIN: [
    // Full patient access
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.CREATE,
    PERMISSIONS.PATIENTS.UPDATE,
    PERMISSIONS.PATIENTS.DELETE,
    
    // Full appointment access
    PERMISSIONS.APPOINTMENTS.VIEW,
    PERMISSIONS.APPOINTMENTS.CREATE,
    PERMISSIONS.APPOINTMENTS.UPDATE,
    PERMISSIONS.APPOINTMENTS.DELETE,
    
    // Full treatment access
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.TREATMENTS.CREATE,
    PERMISSIONS.TREATMENTS.UPDATE,
    
    // Full invoice access
    PERMISSIONS.INVOICES.VIEW,
    PERMISSIONS.INVOICES.CREATE,
    PERMISSIONS.INVOICES.UPDATE,
    PERMISSIONS.INVOICES.DELETE,
    
    // Doctor management
    PERMISSIONS.DOCTORS.VIEW,
    PERMISSIONS.DOCTORS.CREATE,
    PERMISSIONS.DOCTORS.UPDATE,
    PERMISSIONS.DOCTORS.DELETE,
    
    // User/Staff management
    PERMISSIONS.USERS.VIEW,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
    
    // Analytics
    PERMISSIONS.ANALYTICS.VIEW,
    
    // Settings
    PERMISSIONS.SETTINGS.VIEW,
    PERMISSIONS.SETTINGS.UPDATE
  ],
  
  /**
   * DOCTOR - Dental Professional
   * Can view and update patient records, manage appointments and treatments.
   * Can view invoices related to their work.
   */
  DOCTOR: [
    // Patient access (view and update, no delete)
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.UPDATE,
    
    // Appointment access
    PERMISSIONS.APPOINTMENTS.VIEW,
    PERMISSIONS.APPOINTMENTS.CREATE,
    PERMISSIONS.APPOINTMENTS.UPDATE,
    
    // Full treatment access (their primary responsibility)
    PERMISSIONS.TREATMENTS.VIEW,
    PERMISSIONS.TREATMENTS.CREATE,
    PERMISSIONS.TREATMENTS.UPDATE,
    
    // View invoices (to track billing of treatments)
    PERMISSIONS.INVOICES.VIEW,
    
    // View doctor profiles
    PERMISSIONS.DOCTORS.VIEW,
    
    // Analytics for their own performance
    PERMISSIONS.ANALYTICS.VIEW
  ],
  
  /**
   * RECEPTIONIST - Front Desk Staff
   * Can manage patients, appointments, and process invoices.
   * Front-line patient interaction role.
   */
  RECEPTIONIST: [
    // Patient management (no delete - that's admin only)
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.CREATE,
    PERMISSIONS.PATIENTS.UPDATE,
    
    // Full appointment management
    PERMISSIONS.APPOINTMENTS.VIEW,
    PERMISSIONS.APPOINTMENTS.CREATE,
    PERMISSIONS.APPOINTMENTS.UPDATE,
    
    // Invoices - receptionists handle billing
    PERMISSIONS.INVOICES.VIEW,
    PERMISSIONS.INVOICES.CREATE,
    PERMISSIONS.INVOICES.UPDATE,
    
    // View doctors for scheduling
    PERMISSIONS.DOCTORS.VIEW
  ]
}

// =============================================================================
// PERMISSION CHECK FUNCTIONS
// =============================================================================

/**
 * HAS PERMISSION
 * 
 * Check if a role has a specific permission.
 * 
 * @param {string} userRole - User's role (ADMIN, DOCTOR, RECEPTIONIST)
 * @param {string} permission - Permission constant to check
 * @returns {boolean} - True if role has permission
 * 
 * Usage:
 * ```javascript
 * if (hasPermission(user.role, PERMISSIONS.PATIENTS.CREATE)) {
 *   // Allow patient creation
 * }
 * ```
 */
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) {
    return false
  }

  const rolePermissions = ROLE_PERMISSIONS[userRole]
  
  if (!rolePermissions) {
    return false
  }

  return rolePermissions.includes(permission)
}

/**
 * HAS ANY PERMISSION
 * 
 * Check if a role has any of the specified permissions.
 * Returns true if at least one permission is granted.
 * 
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permission constants
 * @returns {boolean} - True if role has any of the permissions
 * 
 * Usage:
 * ```javascript
 * if (hasAnyPermission(user.role, [PERMISSIONS.PATIENTS.DELETE, PERMISSIONS.USERS.DELETE])) {
 *   // Allow deletion operations
 * }
 * ```
 */
export function hasAnyPermission(userRole, permissions) {
  if (!userRole || !Array.isArray(permissions)) {
    return false
  }

  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * HAS ALL PERMISSIONS
 * 
 * Check if a role has all of the specified permissions.
 * Returns true only if ALL permissions are granted.
 * 
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permission constants
 * @returns {boolean} - True if role has all permissions
 * 
 * Usage:
 * ```javascript
 * if (hasAllPermissions(user.role, [PERMISSIONS.PATIENTS.VIEW, PERMISSIONS.PATIENTS.UPDATE])) {
 *   // Allow view and edit operations
 * }
 * ```
 */
export function hasAllPermissions(userRole, permissions) {
  if (!userRole || !Array.isArray(permissions)) {
    return false
  }

  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * GET ROLE PERMISSIONS
 * 
 * Get all permissions for a specific role.
 * 
 * @param {string} userRole - User's role
 * @returns {string[]} - Array of permission strings
 */
export function getRolePermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || []
}

// =============================================================================
// MIDDLEWARE FACTORY FUNCTIONS
// =============================================================================

/**
 * REQUIRE PERMISSION - Middleware Factory
 * 
 * Creates middleware that enforces a specific permission.
 * 
 * @param {string} permission - Permission to require
 * @returns {Function} - Middleware function
 * 
 * Usage in route handlers:
 * ```javascript
 * const checkPermission = requirePermission(PERMISSIONS.PATIENTS.CREATE)
 * 
 * export async function POST(request) {
 *   const { authorized, user, error } = checkPermission(request)
 *   if (!authorized) {
 *     return forbiddenError(error)
 *   }
 *   // Continue with authorized request...
 * }
 * ```
 */
export function requirePermission(permission) {
  return function(request) {
    const user = request.user
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!hasPermission(user.role, permission)) {
      return { 
        authorized: false, 
        error: `Access denied. Required permission: ${permission}`,
        user 
      }
    }

    return { authorized: true, user }
  }
}

/**
 * REQUIRE ANY PERMISSION - Middleware Factory
 * 
 * Creates middleware that requires any of the specified permissions.
 * 
 * @param {string[]} permissions - Array of acceptable permissions
 * @returns {Function} - Middleware function
 */
export function requireAnyPermission(permissions) {
  return function(request) {
    const user = request.user
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!hasAnyPermission(user.role, permissions)) {
      return { 
        authorized: false, 
        error: 'Access denied. Insufficient permissions',
        user 
      }
    }

    return { authorized: true, user }
  }
}

/**
 * REQUIRE ALL PERMISSIONS - Middleware Factory
 * 
 * Creates middleware that requires all specified permissions.
 * 
 * @param {string[]} permissions - Array of required permissions
 * @returns {Function} - Middleware function
 */
export function requireAllPermissions(permissions) {
  return function(request) {
    const user = request.user
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!hasAllPermissions(user.role, permissions)) {
      return { 
        authorized: false, 
        error: 'Access denied. Missing required permissions',
        user 
      }
    }

    return { authorized: true, user }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * GET PERMISSION CATEGORY
 * 
 * Extract the category name from a permission string.
 * 
 * @param {string} permission - Permission constant
 * @returns {string} - Category name (e.g., 'patients', 'appointments')
 * 
 * Example:
 * getPermissionCategory('patients:view') → 'patients'
 */
export function getPermissionCategory(permission) {
  if (!permission || typeof permission !== 'string') {
    return null
  }
  
  const [category] = permission.split(':')
  return category
}

/**
 * GET PERMISSION ACTION
 * 
 * Extract the action from a permission string.
 * 
 * @param {string} permission - Permission constant
 * @returns {string} - Action name (e.g., 'view', 'create')
 * 
 * Example:
 * getPermissionAction('patients:view') → 'view'
 */
export function getPermissionAction(permission) {
  if (!permission || typeof permission !== 'string') {
    return null
  }
  
  const [, action] = permission.split(':')
  return action
}

/**
 * CAN ACCESS RESOURCE
 * 
 * Check if user can access a specific resource based on their role.
 * Combines role check with clinic isolation.
 * 
 * @param {Object} user - Authenticated user object
 * @param {string} resourceClinicId - Clinic ID of the resource
 * @param {string} permission - Required permission
 * @returns {boolean} - True if access is allowed
 */
export function canAccessResource(user, resourceClinicId, permission) {
  if (!user || !resourceClinicId || !permission) {
    return false
  }

  // User must have the required permission
  if (!hasPermission(user.role, permission)) {
    return false
  }

  // User must belong to the same clinic as the resource
  // ADMINs can access their own clinic's resources
  // DOCTORs and RECEPTIONISTs are also clinic-scoped
  return user.clinicId === resourceClinicId
}

/**
 * ROLE HIERARCHY
 * 
 * Defines role hierarchy for inheritance.
 * Higher roles inherit permissions from lower roles.
 */
export const ROLE_HIERARCHY = {
  ADMIN: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'], // Admin has all permissions
  DOCTOR: ['DOCTOR', 'RECEPTIONIST'],          // Doctor has doctor + receptionist permissions
  RECEPTIONIST: ['RECEPTIONIST']              // Receptionist has only receptionist permissions
}

/**
 * IS ROLE HIGHER THAN
 * 
 * Check if role1 is higher than or equal to role2 in hierarchy.
 * 
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean}
 */
export function isRoleHigherOrEqual(role1, role2) {
  const hierarchy = ROLE_HIERARCHY[role1]
  if (!hierarchy) return false
  return hierarchy.includes(role2)
}

// =============================================================================
// PERMISSION DESCRIPTIONS
// =============================================================================

/**
 * HUMAN-READABLE PERMISSION LABELS
 * Used for UI display and error messages.
 */
export const PERMISSION_LABELS = {
  [PERMISSIONS.PATIENTS.VIEW]: 'View Patients',
  [PERMISSIONS.PATIENTS.CREATE]: 'Create Patients',
  [PERMISSIONS.PATIENTS.UPDATE]: 'Update Patients',
  [PERMISSIONS.PATIENTS.DELETE]: 'Delete Patients',
  
  [PERMISSIONS.APPOINTMENTS.VIEW]: 'View Appointments',
  [PERMISSIONS.APPOINTMENTS.CREATE]: 'Create Appointments',
  [PERMISSIONS.APPOINTMENTS.UPDATE]: 'Update Appointments',
  [PERMISSIONS.APPOINTMENTS.DELETE]: 'Delete Appointments',
  
  [PERMISSIONS.TREATMENTS.VIEW]: 'View Treatments',
  [PERMISSIONS.TREATMENTS.CREATE]: 'Create Treatments',
  [PERMISSIONS.TREATMENTS.UPDATE]: 'Update Treatments',
  
  [PERMISSIONS.INVOICES.VIEW]: 'View Invoices',
  [PERMISSIONS.INVOICES.CREATE]: 'Create Invoices',
  [PERMISSIONS.INVOICES.UPDATE]: 'Update Invoices',
  [PERMISSIONS.INVOICES.DELETE]: 'Delete Invoices',
  
  [PERMISSIONS.DOCTORS.VIEW]: 'View Doctors',
  [PERMISSIONS.DOCTORS.CREATE]: 'Create Doctors',
  [PERMISSIONS.DOCTORS.UPDATE]: 'Update Doctors',
  [PERMISSIONS.DOCTORS.DELETE]: 'Delete Doctors',
  
  [PERMISSIONS.USERS.VIEW]: 'View Users',
  [PERMISSIONS.USERS.CREATE]: 'Create Users',
  [PERMISSIONS.USERS.UPDATE]: 'Update Users',
  [PERMISSIONS.USERS.DELETE]: 'Delete Users',
  
  [PERMISSIONS.ANALYTICS.VIEW]: 'View Analytics',
  
  [PERMISSIONS.SETTINGS.VIEW]: 'View Settings',
  [PERMISSIONS.SETTINGS.UPDATE]: 'Update Settings'
}

/**
 * GET PERMISSION LABEL
 * 
 * Get human-readable label for a permission.
 * 
 * @param {string} permission - Permission constant
 * @returns {string} - Human-readable label
 */
export function getPermissionLabel(permission) {
  return PERMISSION_LABELS[permission] || permission
}
