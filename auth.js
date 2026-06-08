const Auth = {
  getUser() {
    const u = localStorage.getItem('voluncheer_user')
    return u ? JSON.parse(u) : null
  },
  setUser(user) {
    localStorage.setItem('voluncheer_user', JSON.stringify(user))
  },
  logout() {
    localStorage.removeItem('voluncheer_user')
  }
}