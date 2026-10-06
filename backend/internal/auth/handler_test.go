package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func setupTestAuthRouter() (*gin.Engine, *Service, TokenService, Repository) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	repo := newMockUserRepository()
	tokenService := NewJWTTokenService("test-secret-at-least-32-characters-long")
	service := NewService(repo, tokenService)

	api := router.Group("/api/v1")
	RegisterPublicRoutes(api, service)

	protected := api.Group("")
	protected.Use(AuthMiddleware(tokenService))
	RegisterProtectedRoutes(protected, service)

	return router, service, tokenService, repo
}

func TestLoginEndpointReturnsTokenOnSuccess(t *testing.T) {
	router, _, _, repo := setupTestAuthRouter()

	hash, _ := HashPassword("gecerli_parola")
	user := &User{
		ID:           uuid.New(),
		Username:     "yonetici",
		Email:        "yonetici@nizamlar.com",
		FullName:     "Sistem Yöneticisi",
		Role:         "admin",
		PasswordHash: hash,
	}
	_ = repo.CreateUser(context.Background(), user)

	body := `{"username":"yonetici","password":"gecerli_parola"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Token == "" {
		t.Error("expected non-empty token")
	}
	if resp.User.Username != "yonetici" {
		t.Errorf("got username %q, want 'yonetici'", resp.User.Username)
	}
}

func TestLoginEndpointRejectsInvalidCredentials(t *testing.T) {
	router, _, _, _ := setupTestAuthRouter()

	body := `{"username":"yonetici","password":"yanlis_parola"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}

	var resp map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["message"] != "Kullanıcı adı veya şifre hatalı." {
		t.Errorf("got message %q, want 'Kullanıcı adı veya şifre hatalı.'", resp["message"])
	}
}

func TestLoginEndpointRejectsEmptyFields(t *testing.T) {
	router, _, _, _ := setupTestAuthRouter()

	body := `{"username":"","password":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestProtectedMeEndpointRejectsMissingToken(t *testing.T) {
	router, _, _, _ := setupTestAuthRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", w.Code)
	}
}

func TestProtectedMeEndpointReturnsUserWithValidToken(t *testing.T) {
	router, _, tokenService, repo := setupTestAuthRouter()

	user := &User{
		ID:       uuid.New(),
		Username: "yonetici",
		Email:    "yonetici@nizamlar.com",
		FullName: "Sistem Yöneticisi",
		Role:     "admin",
	}
	_ = repo.CreateUser(context.Background(), user)

	token, _ := tokenService.GenerateToken(user, 1*time.Hour)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp UserPublicResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Username != "yonetici" {
		t.Errorf("got username %q, want 'yonetici'", resp.Username)
	}
	if resp.Email != "yonetici@nizamlar.com" {
		t.Errorf("got email %q, want 'yonetici@nizamlar.com'", resp.Email)
	}
}
