package main

import (
	"context"
	"log"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/platform"
)

func main() {
	cfg, err := platform.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}

	pool, err := platform.OpenDatabase(context.Background(), cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	router := platform.NewRouter(platform.Dependencies{
		DB:             pool,
		FrontendOrigin: cfg.FrontendOrigin,
	})
	log.Printf("API http://localhost:%s adresinde çalışıyor", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
