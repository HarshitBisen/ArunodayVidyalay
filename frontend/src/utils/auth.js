export const isAuthenticated = () => {
  const userType = localStorage.getItem('userType');
  const user = localStorage.getItem('user');
  return Boolean(userType && user);
};

export const getUserType = () => {
  return localStorage.getItem('userType');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const login = (token, userType, user) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
  localStorage.setItem('userType', userType);
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userType');
  localStorage.removeItem('user');
};
