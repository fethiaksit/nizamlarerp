package jobs

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.POST("/jobs", func(c *gin.Context) {
		var input CreateJobInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli iş bilgilerini girin."})
			return
		}
		job, err := service.CreateJob(c.Request.Context(), input)
		if !respondError(c, err) {
			c.JSON(http.StatusCreated, job)
		}
	})
	group.GET("/jobs", func(c *gin.Context) {
		items, err := service.ListJobs(c.Request.Context(), Filters{Search: c.Query("search"), Status: c.Query("status")})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "İşler alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})
	group.GET("/jobs/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		job, err := service.GetJob(c.Request.Context(), id)
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "İş bulunamadı."})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "İş bilgileri alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, job)
	})
	group.PATCH("/jobs/:id", func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{"message": "İş düzenleme bir sonraki güncellemede eklenecek."})
	})
	group.POST("/jobs/:id/status", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		var input ChangeStatusInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli durum bilgilerini girin."})
			return
		}
		job, err := service.ChangeStatus(c.Request.Context(), id, input)
		if !respondError(c, err) {
			c.JSON(http.StatusOK, job)
		}
	})
}

func parseID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli iş seçin."})
		return uuid.Nil, false
	}
	return id, true
}
func respondError(c *gin.Context, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"message": "İş bulunamadı."})
		return true
	}
	if err.Error() == "Bu iş numarası zaten kullanılıyor." || err.Error() == "Müşteri seçin." || err.Error() == "İş numarası zorunludur." || err.Error() == "Birim seçin." || err.Error() == "Miktar sıfırdan büyük olmalıdır." || err.Error() == "Birim fiyat sıfırdan büyük olmalıdır." || err.Error() == "Sipariş ve teslim tarihi zorunludur." || err.Error() == "Geçerli bir iş durumu seçin." {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return true
	}
	c.JSON(http.StatusInternalServerError, gin.H{"message": "İş kaydedilirken bir sorun oluştu."})
	return true
}
