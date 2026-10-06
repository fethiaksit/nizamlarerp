package main

import (
	"context"
	"log"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/auth"
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

	// Ensure initial admin user exists
	userRepo := auth.NewRepository(pool)
	if err := auth.EnsureInitialUser(context.Background(), userRepo, cfg.InitialAdminUsername, cfg.InitialAdminEmail, cfg.InitialAdminPassword); err != nil {
		log.Printf("Başlangıç kullanıcısı kontrol edilirken hata: %v", err)
	}

	router := platform.NewRouter(platform.Dependencies{
		DB:             pool,
		FrontendOrigin: cfg.FrontendOrigin,
		AuthSecret:     cfg.AuthSecret,
	})
	log.Printf("API http://localhost:%s adresinde çalışıyor", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
