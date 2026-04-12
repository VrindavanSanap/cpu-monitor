package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type APIClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewAPIClient creates an HTTP client pointed at the backend.
// Reads BACKEND_URL and API_KEY from the environment.
func NewAPIClient() *APIClient {
	baseURL := os.Getenv("BACKEND_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8443"
	}
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		panic("API_KEY environment variable is not set")
	}
	return &APIClient{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

// StoreCPUUtilisation POSTs a CPU sample to the backend API.
func StoreCPUUtilisation(ctx context.Context, client *APIClient, sample CPUUtilisation) error {
	payload := struct {
		Utilization float64 `json:"utilization"`
		Timestamp   string  `json:"timestamp"`
	}{
		Utilization: sample.Val,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshalling payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+"/api/cpu", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", client.apiKey)

	resp, err := client.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("posting cpu utilisation: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status: %s", resp.Status)
	}
	return nil
}
