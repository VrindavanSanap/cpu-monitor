package main

import (
	"context"
	"math"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/shirou/gopsutil/v4/cpu"
)

type CPUUtilisation struct {
	Val float64 `json:"v"`
}

func main() {
	// Load .env (non-fatal)
	if err := godotenv.Load(); err != nil {
		slog.Info("No .env file found, relying on environment variables")
	}

	// Create context that can be cancelled on OS signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Setup graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		slog.Info("Shutdown signal received, stopping...")
		cancel()
	}()

	// Create API client
	apiClient := NewAPIClient()

	// Configurable interval (default 1s)
	interval := 1 * time.Second

	slog.Info("Starting CPU monitor", "interval", interval)

	if err := runCPUWorker(ctx, apiClient, interval); err != nil && err != context.Canceled {
		slog.Error("CPU worker stopped with error", "error", err)
		os.Exit(1)
	}

	slog.Info("CPU monitor stopped cleanly")
}

// runCPUWorker contains the actual monitoring loop
func runCPUWorker(ctx context.Context, dbClient *APIClient, interval time.Duration) error {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			percent, err := cpu.Percent(0, false)
			percent[0] = math.Round(percent[0]*100) / 100
			if err != nil {
				slog.Error("Failed to read CPU percent", "error", err)
				continue // don't stop the whole service on a single bad read
			}

			if len(percent) == 0 {
				slog.Warn("cpu.Percent returned no values")
				continue
			}

			util := CPUUtilisation{Val: percent[0]}

			if err := StoreCPUUtilisation(ctx, dbClient, util); err != nil {
				slog.Error("Failed to store CPU utilisation", "value", util.Val, "error", err)
				// continue anyway — we don't want one DB hiccup to kill the monitor
			} else {
				slog.Info("Stored CPU utilisation",
					"percent", fmt.Sprintf("%f", util.Val),
				)
			}
		}
	}
}
