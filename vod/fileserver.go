package vod

import (
	"embed"
	"io/fs" // 引入io/fs包用于处理嵌入式文件系统的子目录
	"log"
	"net/http"
	"strings"

	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

//go:embed wwwroot
var embededFiles embed.FS

func FileServerEmbed(w http.ResponseWriter, r *http.Request, nsCfg *system_config.SysCfg, logger *zap.SugaredLogger, qpsCounter *uint64) {
	upath := r.URL.Path
	if !strings.HasPrefix(upath, "/") {
		upath = "/" + upath
		// log.Println("upath", upath)
		r.URL.Path = upath
	}

	// 显式：如果是根路径或/@nascore_vod/，重写为/index.html 方便后面判断
	if upath == "/" || upath == "/@nascore_vod/" {
		upath = "/index.html"
		r.URL.Path = upath
	}

	// log.Println("Serving files from embedded file system")
	subFS, err := fs.Sub(embededFiles, "wwwroot")
	if err != nil {
		log.Println("Error creating sub-filesystem for wwwroot:", err)
		http.Error(w, "Internal server error: Failed to prepare embedded file server", http.StatusInternalServerError)

		return
	}
	// 如果请求的是html或shtml文件，需要动态替换 {tailwindcss} 为 {{.WebUICdnPrefix}}tailwindcss.min.js
	if strings.HasSuffix(upath, ".html") || strings.HasSuffix(upath, ".shtml") {
		f, err := subFS.Open(strings.TrimPrefix(upath, "/"))
		if err != nil {
			log.Println("[file] open html error:", err)
			http.NotFound(w, r)
			return
		}
		defer f.Close()
		stat, err := f.Stat()
		if err != nil {
			log.Println("[file] stat html error:", err)
			http.NotFound(w, r)
			return
		}
		// 只处理小于10MB的html文件
		if stat.Size() > 10*1024*1024 {
			log.Println("[file] html too large:", upath)
			http.Error(w, "html file too large", http.StatusRequestEntityTooLarge)
			return
		}
		buf := make([]byte, stat.Size())
		_, err = f.Read(buf)
		if err != nil {
			log.Println("[file] read html error:", err)
			http.NotFound(w, r)
			return
		}
		content := string(buf)
		// 这里替换 {tailwindcss} 为 {{.WebUICdnPrefix}}libs/tailwindcss.min.js
		content = strings.ReplaceAll(content, "{tailwindcss}", nsCfg.WebUICdnPrefix+"libs/tailwindcss.min.js")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(content))
		return
	}
	http.FileServer(http.FS(subFS)).ServeHTTP(w, r)
}
