package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterPublicRoutes registers unauthenticated auth endpoints.
func RegisterPublicRoutes(group *gin.RouterGroup, service *Service) {
	h := NewHandler(service)
	group.POST("/auth/login", h.Login)
}

// RegisterProtectedRoutes registers endpoints that require authentication.
func RegisterProtectedRoutes(group *gin.RouterGroup, service *Service) {
	h := NewHandler(service)
	group.GET("/auth/me", h.Me)
	group.POST("/auth/logout", h.Logout)
}

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz istek formatı."})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Kullanıcı adı ve şifre zorunludur."})
		return
	}

	user, err := h.service.Authenticate(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Kullanıcı adı veya şifre hatalı."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Giriş işlemi gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin."})
		return
	}

	token, err := h.service.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Oturum anahtarı oluşturulamadı."})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User:  user.ToPublic(),
	})
}

func (h *Handler) Me(c *gin.Context) {
	rawID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Yetkilendirme bilgisi bulunamadı."})
		return
	}

	userID, ok := rawID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Geçersiz kullanıcı kimliği."})
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		// Fallback to claims if user lookup failed
		username, _ := c.Get("username")
		userEmail, _ := c.Get("userEmail")
		userRole, _ := c.Get("userRole")

		c.JSON(http.StatusOK, UserPublicResponse{
			ID:       userID.String(),
			Username: username.(string),
			Email:    userEmail.(string),
			Role:     userRole.(string),
		})
		return
	}

	c.JSON(http.StatusOK, user.ToPublic())
}

func (h *Handler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Başarıyla çıkış yapıldı."})
}
