package webuiLib

import (
	"bytes"
	"fmt"
	"io"
	"io/fs"
	"path/filepath"
	"strings"
)

// FileHandler 负责文件处理的结构体
type FileHandler struct {
	staticFS fs.FS // 嵌入式文件系统
}

// NewFileHandler 创建新的文件处理器
func NewFileHandler(devMode bool, devPath string, staticFS fs.FS) *FileHandler {
	return &FileHandler{
		staticFS: staticFS,
	}
}

// ReadFileContent_local_or_inBin 读取文件内容
func (h *FileHandler) ReadFileContent_local_or_inBin(path string) ([]byte, error) {

	// 生产模式：从嵌入式文件系统读取
	file, err := h.staticFS.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open embedded file %s: %w", path, err)
	}
	defer file.Close()

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return nil, fmt.Errorf("failed to read embedded file %s: %w", path, err)
	}

	return buf.Bytes(), nil
}

// GetSafePath 获取安全的文件路径
func (h *FileHandler) GetSafePath(requestPath string) string {
	// 移除路径中的 ".." 以防止目录遍历
	path := filepath.Clean(requestPath)
	path = strings.TrimPrefix(path, "/")

	// 处理默认页面
	if path == "" || path == "/" {
		path = "login.shtml"
	}

	return path
}
