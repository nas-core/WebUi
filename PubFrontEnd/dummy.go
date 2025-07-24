package PubFrontEnd

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

type NavMenuItem struct {
	Name             string `json:"name"`
	URL              string `json:"url"`
	Key              string `json:"key"`
	OnlyWhenLogin    bool   `json:"onlyWhenLogin,omitempty"`
	OnlyWhenNotLogin bool   `json:"onlyWhenNotLogin,omitempty"`
	OnlyWhenAdmin    bool   `json:"onlyWhenAdmin,omitempty"`
}

func HandlerNavJS(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		menu := []NavMenuItem{}
		if nsCfg.NascoreExt.Links.LinksEnable {
			menu = append(menu, NavMenuItem{Name: "导航页", URL: "/", Key: "links"})
		}
		if nsCfg.Server.WebuiAndApiEnable {
			menu = append(menu,
				NavMenuItem{Name: "文件管理", URL: nsCfg.Server.WebUIPrefix + "nascore.shtml", Key: "webui"},
			)
		}
		if nsCfg.ThirdPartyExt.DdnsGO.IsDDnsGOProxyEnable {
			menu = append(menu, NavMenuItem{Name: "DDNS-GO", URL: system_config.PrefixDdnsGo, Key: "ddnsgo", OnlyWhenAdmin: true})
		}
		if nsCfg.ThirdPartyExt.AdGuard.IsAdGuardProxyEnable {
			menu = append(menu, NavMenuItem{Name: "AdGuardHome", URL: system_config.PrefixAdguardhome, Key: "adguardhome", OnlyWhenAdmin: true})
		}
		if nsCfg.NascoreExt.Vod.VodEnable {
			menu = append(menu, NavMenuItem{Name: "视频订阅", URL: system_config.PrefixNasCoreTv, Key: "vod"})
		}
		menu = append(menu,
			NavMenuItem{Name: "系统管理", URL: system_config.PrefixPublicFun + "/system/", Key: "system", OnlyWhenAdmin: true},
			NavMenuItem{Name: "登录", URL: system_config.PrefixPublicFun + "/login/?redirect=${location}", Key: "login", OnlyWhenNotLogin: true},
			NavMenuItem{Name: "退出", URL: "javascript:logoutAndRedirect()", Key: "logout", OnlyWhenLogin: true},
		)
		menuJson, _ := json.Marshal(menu)

		fmt.Fprintf(w, `window.GlobalNavMenu = %s;
window.isLoggedIn = function() {
  var expires = localStorage.getItem('nascore_jwt_refresh_token_expires');
  if (!expires) return false;
  var now = Math.floor(Date.now() / 1000);
  if (parseInt(expires, 10) < now) return false;
  return true;
};
// 新增 IsAdmin 公用函数
window.IsAdmin = function() {
  var token = localStorage.getItem('nascore_jwt_refresh_token');
  if (!token) return false;
  try {
    var payload = token.split('.')[1];
    if (!payload) return false;
    // base64url 解码
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    var json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    var obj = JSON.parse(json);
    return !!obj.IsAdmin;
  } catch (e) {
    return false;
  }
};
(function(){
  if(window.GlobalNavMenu) {
    window.GlobalNavMenu.forEach(function(item){
      if(item.key==='login' && item.url && item.url.indexOf('${location}')!==-1) {
        item.url = item.url.replace('${location}', encodeURIComponent(location.href));
      }
    });
  }
  window.logoutAndRedirect = function() {
    // 清理 localStorage

    localStorage.removeItem("clipboard");
    localStorage.removeItem("nascore_jwt_access_token");
    localStorage.removeItem("nascore_jwt_access_token_expires");
    localStorage.removeItem("nascore_jwt_refresh_token");
    localStorage.removeItem("nascore_jwt_refresh_token_expires");
    // 清理所有以jwt_和nascore_jwt_开头的localStorage
    Object.keys(localStorage).forEach(function(key){
      if(/^jwt_|^nascore_jwt_/.test(key)) localStorage.removeItem(key);
    });
    // 清理 cookies
    function deleteCookie(name) {
      var domains = ['', window.location.hostname, '.'+window.location.hostname];
      var paths = ['/', window.location.pathname, ''];
      domains.forEach(function(domain){
        paths.forEach(function(path){
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + path + (domain ? '; domain=' + domain : '') + ';';
        });
      });
    }
    [
      'nascore_jwt_access_token',
      'nascore_jwt_access_token_expires',
      'nascore_jwt_refresh_token',
      'nascore_jwt_refresh_token_expires',
      'clipboard',
    ].forEach(deleteCookie);
    // 跳转到登录页
    var loginUrl = "/@public/login/?redirect=" + encodeURIComponent(location.href);
    window.location.href = loginUrl;
  }
})();
`, menuJson)
	}
}
