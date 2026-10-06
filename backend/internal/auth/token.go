package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// TokenClaims represents the claims stored inside a JWT token.
type TokenClaims struct {
	UserID    uuid.UUID `json:"sub"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	ExpiresAt int64     `json:"exp"`
	IssuedAt  int64     `json:"iat"`
}

// TokenService defines token generation and validation.
type TokenService interface {
	GenerateToken(user *User, ttl time.Duration) (string, error)
	ValidateToken(tokenString string) (*TokenClaims, error)
}

// JWTTokenService implements TokenService using HMAC-SHA256 JWT.
type JWTTokenService struct {
	secret []byte
}

func NewJWTTokenService(secret string) *JWTTokenService {
	return &JWTTokenService{secret: []byte(secret)}
}

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

func (s *JWTTokenService) GenerateToken(user *User, ttl time.Duration) (string, error) {
	if len(s.secret) == 0 {
		return "", errors.New("JWT gizli anahtarı tanımlanmamış")
	}

	header := jwtHeader{Alg: "HS256", Typ: "JWT"}
	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	headerEncoded := base64.RawURLEncoding.EncodeToString(headerBytes)

	now := time.Now()
	claims := TokenClaims{
		UserID:    user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		ExpiresAt: now.Add(ttl).Unix(),
		IssuedAt:  now.Unix(),
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	claimsEncoded := base64.RawURLEncoding.EncodeToString(claimsBytes)

	unsignedToken := fmt.Sprintf("%s.%s", headerEncoded, claimsEncoded)
	signature := s.sign(unsignedToken)
	signatureEncoded := base64.RawURLEncoding.EncodeToString(signature)

	return fmt.Sprintf("%s.%s", unsignedToken, signatureEncoded), nil
}

func (s *JWTTokenService) ValidateToken(tokenString string) (*TokenClaims, error) {
	if len(s.secret) == 0 {
		return nil, errors.New("JWT gizli anahtarı tanımlanmamış")
	}

	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("Geçersiz token formatı")
	}

	unsignedToken := fmt.Sprintf("%s.%s", parts[0], parts[1])
	expectedSig := s.sign(unsignedToken)

	providedSig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, errors.New("Geçersiz token imzası")
	}

	if !hmac.Equal(expectedSig, providedSig) {
		return nil, errors.New("Token doğrulaması başarısız")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("Token yükü çözülemedi")
	}

	var claims TokenClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, errors.New("Token içeriği okunamadı")
	}

	if time.Now().Unix() > claims.ExpiresAt {
		return nil, errors.New("Oturum süresi dolmuş")
	}

	return &claims, nil
}

func (s *JWTTokenService) sign(data string) []byte {
	h := hmac.New(sha256.New, s.secret)
	h.Write([]byte(data))
	return h.Sum(nil)
}
