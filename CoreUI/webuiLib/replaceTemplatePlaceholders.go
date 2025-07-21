package webuiLib

import (
	"strings"

	"github.com/nas-core/nascore/nascore_util/system_config"
)

// replaceTemplatePlaceholders 替换模板中的占位符
func ReplaceTemplatePlaceholders(content string, webuiCdnPrefix string, ServerUrl string) string {
	content = strings.ReplaceAll(content, "{{.ServerUrl}}", ServerUrl)
	content = strings.ReplaceAll(content, "{{.WebUICdnPrefix}}", webuiCdnPrefix)
	content = strings.ReplaceAll(content, "{{.PrefixDdnsGo}}", system_config.PrefixDdnsGo)
	content = strings.ReplaceAll(content, "{{.PrefixAdguardhome}}", system_config.PrefixAdguardhome)
	return content
}
