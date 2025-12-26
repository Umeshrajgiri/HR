// Role-Based Access Control (RBAC) Utility Functions
// This file provides centralized RBAC functions for the entire application

/**
 * Get current user from session storage
 * @returns {Object|null} Current user object or null
 */
function getCurrentUser() {
    try {
        const userStr = sessionStorage.getItem('nexhr_currentUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing current user:', error);
        return null;
    }
}

/**
 * Check if current user is Admin
 * @returns {boolean} True if user is Admin, false otherwise
 */
function isAdmin() {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const role = currentUser.role || '';
    const username = currentUser.username || '';
    
    return role === 'Admin' || 
           role === 'admin' || 
           username === 'admin' || 
           username === 'Admin';
}

/**
 * Check if current user has permission to perform admin actions
 * Shows error message and returns false if not admin
 * @param {string} action - Description of the action being attempted
 * @returns {boolean} True if allowed, false if denied
 */
function checkAdminPermission(action = 'perform this action') {
    if (!isAdmin()) {
        const message = `Access Denied: Only Administrators can ${action}.`;
        if (typeof showToast === 'function') {
            showToast(message);
        } else {
            alert(message);
        }
        return false;
    }
    return true;
}

/**
 * Restrict access to a page - redirects non-admin users
 * @param {string} redirectUrl - URL to redirect to if not admin (default: dashboard.html)
 */
function restrictToAdmin(redirectUrl = 'dashboard.html') {
    if (!isAdmin()) {
        if (typeof showToast === 'function') {
            showToast('Access Denied: This page is for Administrators only.');
        } else {
            alert('Access Denied: This page is for Administrators only.');
        }
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Hide or disable elements for non-admin users
 * @param {string|NodeList|Array} selector - CSS selector, NodeList, or Array of elements
 * @param {boolean} disableOnly - If true, only disable elements instead of hiding
 */
function restrictElementsForNonAdmin(selector, disableOnly = false) {
    if (isAdmin()) return; // Don't restrict for admins
    
    let elements;
    if (typeof selector === 'string') {
        elements = document.querySelectorAll(selector);
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
        elements = selector;
    } else {
        return;
    }
    
    elements.forEach(element => {
        if (disableOnly) {
            element.disabled = true;
            element.style.opacity = '0.5';
            element.style.cursor = 'not-allowed';
        } else {
            element.style.display = 'none';
        }
    });
}

/**
 * Make form fields read-only for non-admin users
 * @param {string|HTMLElement} formSelector - CSS selector or form element
 */
function makeFormReadOnlyForNonAdmin(formSelector) {
    if (isAdmin()) return; // Don't restrict for admins
    
    const form = typeof formSelector === 'string' 
        ? document.querySelector(formSelector) 
        : formSelector;
    
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
    inputs.forEach(input => {
        if (input.type === 'submit' || input.tagName === 'BUTTON') {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.style.cursor = 'not-allowed';
        } else {
            input.readOnly = true;
            input.disabled = true;
            input.style.backgroundColor = 'var(--bg-dark)';
            input.style.cursor = 'not-allowed';
        }
    });
}

