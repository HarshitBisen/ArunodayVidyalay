export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getUserType = () => {
  return localStorage.getItem('userType');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const login = (token, userType, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userType', userType);
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('user');
};