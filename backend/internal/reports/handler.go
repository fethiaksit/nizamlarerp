package reports

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.GET("/reports/customer-balance", func(c *gin.Context) {
		items, err := service.CustomerBalanceReport(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Cari raporu oluşturulurken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	group.GET("/reports/financial-summary", func(c *gin.Context) {
		rep, err := service.FinancialSummaryReport(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Finansal özet raporu oluşturulurken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, rep)
	})

	group.GET("/reports/production-summary", func(c *gin.Context) {
		items, err := service.ProductionSummaryReport(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Üretim raporu oluşturulurken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})
}
