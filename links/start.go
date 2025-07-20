package links

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"strings"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

//go:embed tpl/*
var embedFS embed.FS

func FileServ(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		//logger.Debug("path", path)
		if path == "/@links/" || path == "/@links/index.html" || path == "" || path == "/" || path == "index.html" {
			http.NotFound(w, r)
			return
		}

		tplFS, _ := fs.Sub(embedFS, "tpl")
		http.FileServer(http.FS(tplFS)).ServeHTTP(w, r)
	}
}
func IndexPage(nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) http.HandlerFunc {
	prefix := nsCfg.Server.WebUIPrefix

	return func(w http.ResponseWriter, r *http.Request) {
		f, err := embedFS.Open("tpl/links-standalone.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusNotFound)
			return
		}
		defer f.Close()
		content, err := io.ReadAll(f)
		if err != nil {
			http.Error(w, "failed to read index.html", http.StatusInternalServerError)
			return
		}
		html := string(content)
		inject := "<script>window.NASCORE_WEBUI_PREFIX = '" + prefix + "';</script>"
		html = strings.ReplaceAll(html, "{inject}", inject)
		html = strings.ReplaceAll(html, "{public}", system_config.PrefixPublicFun)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(html))
	}
}
