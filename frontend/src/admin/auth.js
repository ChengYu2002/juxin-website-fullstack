// src/admin/auth.js
// Admin authentication token management
// Stores, retrieves, and clears the admin JWT token in localStorage

const KEY = 'admin_jwt'

export function setAdminToken(token) {
  return localStorage.setItem(KEY, token)
}

export function getAdminToken() {
  return localStorage.getItem(KEY)
}

export function clearAdminToken() {
  return localStorage.removeItem(KEY)
}