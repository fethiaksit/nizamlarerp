package platform

import (
	"net/http"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/auth"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/checks"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/customers"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/dashboard"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/finance"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/jobs"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/personnel"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/reports"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/settings"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies are shared application resources passed to route modules.
type Dependencies struct {
	DB             *pgxpool.Pool
	FrontendOrigin string
	AuthSecret     string
}

func NewRouter(deps Dependencies) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors(deps.FrontendOrigin))

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	if deps.DB != nil {
		authSecret := deps.AuthSecret
		if authSecret == "" {
			authSecret = "nizamlar-tekstil-erp-jwt-secret-key-development-2026"
		}
		authRepo := auth.NewRepository(deps.DB)
		tokenService := auth.NewJWTTokenService(authSecret)
		authService := auth.NewService(authRepo, tokenService)

		// Public authentication routes (login)
		auth.RegisterPublicRoutes(api, authService)

		// Protected API routes
		protected := api.Group("")
		protected.Use(auth.AuthMiddleware(tokenService))

		auth.RegisterProtectedRoutes(protected, authService)

		customerRepository := customers.NewRepository(deps.DB)
		ledgerRepository := ledger.NewRepository(deps.DB)

		customers.RegisterRoutes(protected, customers.NewService(customerRepository, ledgerRepository))
		jobs.RegisterRoutes(protected, jobs.NewService(jobs.NewRepository(deps.DB)))
		dashboard.RegisterRoute(protected, dashboard.NewService(dashboard.NewRepository(deps.DB)))
		finance.RegisterRoutes(protected, finance.NewService(finance.NewRepository(deps.DB)))
		checks.RegisterRoutes(protected, checks.NewService(checks.NewRepository(deps.DB)))
		personnel.RegisterRoutes(protected, personnel.NewService(personnel.NewRepository(deps.DB)))
		reports.RegisterRoutes(protected, reports.NewService(reports.NewRepository(deps.DB)))
		settings.RegisterRoutes(protected, settings.NewService(settings.NewRepository(deps.DB)))
	}

	return router
}

func cors(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}
