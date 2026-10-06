package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"strings"
)

// EnsureInitialUser checks if the users table is empty and seeds an initial admin if needed.
func EnsureInitialUser(ctx context.Context, repo Repository, username, email, password string) error {
	count, err := repo.CountUsers(ctx)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	cleanUsername := strings.TrimSpace(username)
	if cleanUsername == "" {
		cleanUsername = "admin"
	}

	cleanEmail := strings.TrimSpace(email)
	if cleanEmail == "" {
		cleanEmail = "admin@nizamlar.com"
	}

	cleanPassword := strings.TrimSpace(password)
	if cleanPassword == "" {
		// Generate random temporary password if none provided
		bytes := make([]byte, 8)
		_, _ = rand.Read(bytes)
		cleanPassword = hex.EncodeToString(bytes)
		log.Printf("[GÜVENLİK BİLGİSİ] INITIAL_ADMIN_PASSWORD belirtilmediği için geçici parola oluşturuldu: %s", cleanPassword)
	}

	hash, err := HashPassword(cleanPassword)
	if err != nil {
		return err
	}

	user := &User{
		Username:     cleanUsername,
		Email:        cleanEmail,
		FullName:     "Sistem Yöneticisi",
		Role:         "admin",
		PasswordHash: hash,
	}

	if err := repo.CreateUser(ctx, user); err != nil {
		return err
	}

	log.Printf("Başlangıç yönetici kullanıcısı başarıyla oluşturuldu: %s (%s)", user.Username, user.Email)
	return nil
}
