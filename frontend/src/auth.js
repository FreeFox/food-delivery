import api from './api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function removeToken() {
  localStorage.removeItem('token');
}

function getUserInfo() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function setUserInfo(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function removeUserInfo() {
  localStorage.removeItem('user');
}

async function register(email, password) {
  const res = await api.post('/api/v1/auth/register', { email, password });
  const { token, userId } = res.data;
  setToken(token);
  setUserInfo({ userId, email });
  return res.data;
}

async function login(email, password) {
  const res = await api.post('/api/v1/auth/login', { email, password });
  const { token, userId } = res.data;
  setToken(token);
  setUserInfo({ userId, email });
  return res.data;
}

function logout() {
  removeToken();
  removeUserInfo();
}

function isAuthenticated() {
  return !!getToken();
}

export default {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  register,
  login,
  logout,
  isAuthenticated
};
