package PubFrontEnd

import (
	"net/http"
	"path"
	"strings"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

func SystemConfigLoginPage(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqPath := r.URL.Path
		var file string
		if r.URL.Path == "" {
			file = "tpl/system/system.html"

		} else {
			file = "tpl/system/" + reqPath

		}

		data, err := loginFS.ReadFile(file)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("404 not found"))
			return
		}
		// 自动设置Content-Type
		ext := path.Ext(file)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		case ".html":
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		default:
			w.Header().Set("Content-Type", "application/octet-stream")
		}
		content := strings.ReplaceAll(string(data), "{tailwindcss}", "<script src='"+nsCfg.WebUICdnPrefix+"libs/tailwindcss.min.js'></script>")
		w.Write([]byte(content))
	}
}
