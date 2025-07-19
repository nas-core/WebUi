package CoreUI

import (
	"embed"
	"fmt"
	"regexp"
	"strings"

	"go.uber.org/zap"
)

//go:embed wwwroot
var embeddedFS embed.FS

func parseSSI(filePath string, basePatch string, logger *zap.SugaredLogger) (string, error) {
	var content []byte
	var err error

	content, err = embeddedFS.ReadFile(filePath)
	if err != nil {
		logger.Errorln("Error reading embedded file:", err)
		return "", fmt.Errorf("error reading embedded file %s: %v", filePath, err)
	}

	html := string(content)
	// <!--#include file="include/footer.html" -->
	re := regexp.MustCompile(`<!--#include file="(.*?)" -->`)
	matches := re.FindAllStringSubmatch(html, -1)

	if len(matches) == 0 {
		logger.Debug("No SSI directives found in", filePath)
	}
	for _, match := range matches {
		includePath := match[1]
		var includeContent []byte
		includeContent, err = embeddedFS.ReadFile(basePatch + includePath)
		if err != nil {
			logger.Errorln("Error reading embedded file:", err)
			return "", fmt.Errorf("error reading embedded file %s: %v", includePath, err)
		}

		html = strings.ReplaceAll(html, match[0], string(includeContent))
	}
	return html, nil
}
