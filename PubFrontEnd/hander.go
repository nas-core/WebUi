package PubFrontEnd

import (
	"embed"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

//go:embed tpl/*
var loginFS embed.FS

// 通用静态文件处理
func ServeStaticFile(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64, basePath string, indexFile string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		reqPath := r.URL.Path
		var file string
		if reqPath == "" || reqPath == "/" {
			file = basePath + indexFile
		} else {
			file = basePath + reqPath
		}

		data, err := loginFS.ReadFile(file)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("404 not found"))
			return
		}
		ext := path.Ext(file)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		case ".html":
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		}
		if ext == ".js" || ext == ".css" || ext == ".html" {
			content := strings.ReplaceAll(string(data), "{tailwindcss}", "<script src='"+nsCfg.WebUICdnPrefix+"libs/tailwindcss.min.js'></script>")
			w.Write([]byte(content))
			return
		}
		// 其它类型直接用ServeContent
		http.ServeContent(w, r, file, time.Now(), strings.NewReader(string(data)))
	}
}

func HandlerLoginPage(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return ServeStaticFile(nsCfg, logger, qpsCounter, "tpl/login/", "login.html")
}

func SystemConfigLoginPage(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return ServeStaticFile(nsCfg, logger, qpsCounter, "tpl/system/", "system.html")
}

func ThemeJsPaget(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return ServeStaticFile(nsCfg, logger, qpsCounter, "tpl/theme/", "theme.js")
}
