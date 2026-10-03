package checks

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.GET("/checks", func(c *gin.Context) {
		items, err := service.List(c.Request.Context(), Filters{
			CheckType: c.Query("type"),
			Status:    c.Query("status"),
			Search:    c.Query("search"),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Çekler alınırken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	group.GET("/checks/:id", func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz çek ID."})
			return
		}
		ch, err := service.Get(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Çek bulunamadı."})
			return
		}
		c.JSON(http.StatusOK, ch)
	})

	group.POST("/checks", func(c *gin.Context) {
		var input CreateCheckInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli çek bilgilerini girin."})
			return
		}
		ch, err := service.Create(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, ch)
	})

	group.POST("/checks/:id/status", func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz çek ID."})
			return
		}
		var input UpdateCheckStatusInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli durum bilgilerini girin."})
			return
		}
		ch, err := service.UpdateStatus(c.Request.Context(), id, input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, ch)
	})
}
