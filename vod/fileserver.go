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

/*
 *
 func LoginFileServer(w http.ResponseWriter, r *http.Request) {
	content, err := embededFiles.ReadFile("wwwroot/login.html")
	if err != nil {
		log.Println("Error reading login.html from embedded file system:", err)
		http.Error(w, "Internal server error: Failed to read login.html", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Length", (strconv.Itoa(len(content))))
	if _, err := w.Write(content); err != nil {
		log.Println("Failed to write login.html content to response:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
 }

*/
