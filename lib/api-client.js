/**
 * API Client for Dental SaaS Platform
 * Centralized API client with automatic auth token handling,
 * error handling, request/response interceptors, and retry logic.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Token management
export const tokenManager = {
  get: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Request queue for retry mechanism
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Core fetch function with retry logic
async function fetchWithRetry(url, options, retries = 3) {
  const response = await fetch(url, options);
  
  // If response is 401 and we have retries left, try to refresh token
  if (response.status === 401 && retries > 0) {
    try {
      await refreshToken();
      // Retry the original request
      return fetchWithRetry(url, options, retries - 1);
    } catch (error) {
      throw new ApiError('Session expired. Please login again.', 401, 'SESSION_EXPIRED');
    }
  }
  
  return response;
}

// Token refresh
async function refreshToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      tokenManager.set(data.token);
      processQueue(null, data.token);
      return data.token;
    } else {
      tokenManager.remove();
      processQueue(new Error('Refresh failed'));
      throw new ApiError('Refresh failed', 401, 'REFRESH_FAILED');
    }
  } catch (error) {
    processQueue(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

// Parse response
async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return { data, contentType };
  }
  
  const text = await response.text();
  return { data: text, contentType };
}

// Main API client
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  // Build headers
  buildHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    // Add auth token if available
    const token = tokenManager.get();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Build full URL
  buildURL(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  // Request method
  async request(method, endpoint, options = {}) {
    const { data, params, headers, ...rest } = options;
    
    // Build URL with parameters
    const url = this.buildURL(endpoint, params);
    
    // Build request options
    const requestOptions = {
      method,
      headers: this.buildHeaders(headers),
      ...rest
    };

    // Add body for methods that support it
    if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      requestOptions.body = JSON.stringify(data);
    }

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      const modifiedOptions = await interceptor(requestOptions);
      if (modifiedOptions) {
        Object.assign(requestOptions, modifiedOptions);
      }
    }

    try {
      const response = await fetchWithRetry(url, requestOptions);
      const { data: responseData, contentType } = await parseResponse(response);

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        const modifiedResponse = await interceptor(response);
        if (modifiedResponse) {
          return modifiedResponse;
        }
      }

      // Handle error responses
      if (!response.ok) {
        const error = new ApiError(
          responseData?.message || responseData?.error || 'An error occurred',
          response.status,
          responseData?.code || 'UNKNOWN_ERROR',
          responseData
        );
        throw error;
      }

      return responseData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network errors
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }
  }

  // HTTP methods
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, { ...options, data });
  }

  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, { ...options, data });
  }

  patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, { ...options, data });
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  // File upload
  async upload(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const token = tokenManager.get();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetchWithRetry(
      this.buildURL(endpoint),
      {
        method: 'POST',
        headers,
        body: formData
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(
        data.message || 'Upload failed',
        response.status,
        'UPLOAD_ERROR',
        data
      );
    }

    return response.json();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Add response interceptor for handling 401 errors
apiClient.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    tokenManager.remove();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  return response;
});

// API endpoints organized by module
export const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    register: (userData) => apiClient.post('/api/auth/register', userData),
    logout: () => apiClient.post('/api/auth/logout'),
    me: () => apiClient.get('/api/auth/me'),
    refresh: () => apiClient.post('/api/auth/refresh')
  },

  // Dashboard
  dashboard: {
    getStats: () => apiClient.get('/api/dashboard/stats')
  },

  // Patients
  patients: {
    list: (params) => apiClient.get('/api/patients', { params }),
    get: (id) => apiClient.get(`/api/patients/${id}`),
    create: (data) => apiClient.post('/api/patients', data),
    update: (id, data) => apiClient.put(`/api/patients/${id}`, data),
    delete: (id) => apiClient.delete(`/api/patients/${id}`),
    getAppointments: (id) => apiClient.get(`/api/patients/${id}/appointments`),
    getDocuments: (id) => apiClient.get(`/api/patients/${id}/documents`),
    getHistory: (id) => apiClient.get(`/api/patients/${id}/history`),
    getInvoices: (id) => apiClient.get(`/api/patients/${id}/invoices`),
    getTreatments: (id) => apiClient.get(`/api/patients/${id}/treatments`)
  },

  // Appointments
  appointments: {
    list: (params) => apiClient.get('/api/appointments', { params }),
    get: (id) => apiClient.get(`/api/appointments/${id}`),
    create: (data) => apiClient.post('/api/appointments', data),
    update: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
    delete: (id) => apiClient.delete(`/api/appointments/${id}`),
    getAvailableSlots: (params) => apiClient.get('/api/appointments/available-slots', { params })
  },

  // Calendar
  calendar: {
    getEvents: (params) => apiClient.get('/api/calendar', { params })
  },

  // Doctors
  doctors: {
    list: (params) => apiClient.get('/api/doctors', { params }),
    get: (id) => apiClient.get(`/api/doctors/${id}`),
    create: (data) => apiClient.post('/api/doctors', data),
    update: (id, data) => apiClient.put(`/api/doctors/${id}`, data),
    delete: (id) => apiClient.delete(`/api/doctors/${id}`)
  },

  // Billing
  billing: {
    getInvoices: (params) => apiClient.get('/api/invoices', { params }),
    getInvoice: (id) => apiClient.get(`/api/invoices/${id}`),
    createInvoice: (data) => apiClient.post('/api/invoices', data),
    updateInvoice: (id, data) => apiClient.put(`/api/invoices/${id}`, data),
    recordPayment: (id, data) => apiClient.post(`/api/invoices/${id}/payment`, data),
    getStats: () => apiClient.get('/api/invoices/stats')
  },

  // Analytics
  analytics: {
    getOverview: (params) => apiClient.get('/api/analytics/overview', { params }),
    getAppointments: (params) => apiClient.get('/api/analytics/appointments', { params }),
    getPatients: (params) => apiClient.get('/api/analytics/patients', { params }),
    getRevenue: (params) => apiClient.get('/api/analytics/revenue', { params }),
    getDoctors: (params) => apiClient.get('/api/analytics/doctors', { params }),
    getTreatments: (params) => apiClient.get('/api/analytics/treatments', { params })
  },

  // Clinic
  clinic: {
    getSettings: () => apiClient.get('/api/clinic/settings'),
    updateSettings: (data) => apiClient.put('/api/clinic/settings', data),
    getUsers: (params) => apiClient.get('/api/clinic/users', { params }),
    getUser: (id) => apiClient.get(`/api/clinic/users/${id}`),
    createUser: (data) => apiClient.post('/api/clinic/users', data),
    updateUser: (id, data) => apiClient.put(`/api/clinic/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/api/clinic/users/${id}`),
    getStats: () => apiClient.get('/api/clinic/stats')
  },

  // Admin
  admin: {
    getClinics: (params) => apiClient.get('/api/admin/clinics', { params }),
    getClinic: (id) => apiClient.get(`/api/admin/clinics/${id}`),
    createClinic: (data) => apiClient.post('/api/admin/clinics', data),
    updateClinic: (id, data) => apiClient.put(`/api/admin/clinics/${id}`, data),
    deleteClinic: (id) => apiClient.delete(`/api/admin/clinics/${id}`),
    getUsers: (params) => apiClient.get('/api/admin/users', { params }),
    createUser: (data) => apiClient.post('/api/admin/users', data),
    updateUser: (id, data) => apiClient.put(`/api/admin/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/api/admin/users/${id}`),
    generateLicense: (data) => apiClient.post('/api/admin/license/generate', data),
    getDashboard: () => apiClient.get('/api/admin/dashboard')
  },

  // Notifications
  notifications: {
    list: (params) => apiClient.get('/api/notifications', { params }),
    markAsRead: (id) => apiClient.put(`/api/notifications/${id}`, { read: true }),
    markAllAsRead: () => apiClient.post('/api/notifications/mark-all-read'),
    getUnreadCount: () => apiClient.get('/api/notifications/unread-count'),
    getSettings: () => apiClient.get('/api/notifications/settings'),
    updateSettings: (data) => apiClient.put('/api/notifications/settings', data)
  },

  // Documents
  documents: {
    list: (params) => apiClient.get('/api/documents', { params }),
    get: (id) => apiClient.get(`/api/documents/${id}`),
    upload: (file, data) => apiClient.upload('/api/documents', file, data),
    delete: (id) => apiClient.delete(`/api/documents/${id}`)
  },

  // Treatments
  treatments: {
    list: (params) => apiClient.get('/api/treatments', { params }),
    get: (id) => apiClient.get(`/api/treatments/${id}`),
    create: (data) => apiClient.post('/api/treatments', data),
    update: (id, data) => apiClient.put(`/api/treatments/${id}`, data),
    delete: (id) => apiClient.delete(`/api/treatments/${id}`)
  },

  // Reminders
  reminders: {
    sendAppointmentReminders: (data) => apiClient.post('/api/reminders/appointments', data)
  }
};

export default apiClient;
