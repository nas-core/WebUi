package main

import (
	"log"
	"net/http"
	"os"

	"github.com/nas-core/WebUi/CoreUI"
	"github.com/nas-core/nascore/nascore_util/system_config"
	"go.uber.org/zap"
)

func main() {
	configPath := os.Args[1]
	CoreUI.ServerUrl = os.Args[2] // http://127.0.0.1:9000/

	nsCfg, err := system_config.LoadConfig(configPath)
	if err != nil {
		panic("Failed to load config")
	}
	logger := zap.NewExample().Sugar()
	var qpsCounter *uint64

	http.HandleFunc("/", CoreUI.Webui_handler(nsCfg, logger, qpsCounter))
	err = http.ListenAndServe(":9001", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
