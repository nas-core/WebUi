package PubFrontEnd

import (
	"embed"
	"net/http"
	"path"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

//go:embed tpl/*
var loginFS embed.FS

func HandlerLoginPage(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqPath := r.URL.Path
		var file string
		if r.URL.Path == "" {
			file = "tpl/login.html"

		} else {
			file = "tpl/" + reqPath

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
		w.Write(data)
	}
}
