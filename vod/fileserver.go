package vod

import (
	"embed"
	"io/fs" // 引入io/fs包用于处理嵌入式文件系统的子目录
	"log"
	"net/http"
	"strings"
)

//go:embed wwwroot
var embededFiles embed.FS

func FileServerEmbed(w http.ResponseWriter, r *http.Request) {
	upath := r.URL.Path
	if !strings.HasPrefix(upath, "/") {
		upath = "/" + upath
		// log.Println("upath", upath)
		r.URL.Path = upath
	}
	// log.Println("Serving files from embedded file system")
	subFS, err := fs.Sub(embededFiles, "wwwroot")
	if err != nil {
		log.Println("Error creating sub-filesystem for wwwroot:", err)
		http.Error(w, "Internal server error: Failed to prepare embedded file server", http.StatusInternalServerError)
		return
	}
	http.FileServer(http.FS(subFS)).ServeHTTP(w, r)
}
