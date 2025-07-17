function loginOut(jump) {
  //删除缓存中 jwt_access_token jwt_access_token_expires jwt_refresh_token jwt_refresh_token_expires
  localStorage.removeItem("jwt_access_token");
  localStorage.removeItem("jwt_access_token_expires");
  localStorage.removeItem("jwt_refresh_token");
  localStorage.removeItem("jwt_refresh_token_expires");
  localStorage.removeItem("clipboard"); //防止多账号切换冲突
  //跳转到
  window.location.href = jump;
}
