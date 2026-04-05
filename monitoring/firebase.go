package main

import (
	"context"
	"fmt"
	"os"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/db"
	"google.golang.org/api/option"
)

// NewDBClient initialises a Firebase app and returns a *db.Client.
func NewDBClient(ctx context.Context) (*db.Client, error) {
	secretPath := os.Getenv("FIREBASE_SECRET_PATH")
	databaseURL := os.Getenv("FIREBASE_DATABASE_URL")
	if secretPath == "" {
		return nil, fmt.Errorf("FIREBASE_SECRET_PATH is not set")
	}
	if databaseURL == "" {
		return nil, fmt.Errorf("FIREBASE_DATABASE_URL is not set")
	}

	opt := option.WithCredentialsFile(secretPath)
	config := &firebase.Config{DatabaseURL: databaseURL}

	app, err := firebase.NewApp(ctx, config, opt)
	if err != nil {
		return nil, fmt.Errorf("initialising firebase app: %w", err)
	}

	client, err := app.Database(ctx)
	if err != nil {
		return nil, fmt.Errorf("initialising database client: %w", err)
	}

	return client, nil
}

// StoreCPUUtilisation writes a CPUUtilisation sample under
// cpu_util_samples/<YYYY-MM-DD-HH>/<unix-ms>.
func StoreCPUUtilisation(ctx context.Context, client *db.Client, sample CPUUtilisation) error {
	now := time.Now().UTC()
	hourBucket := now.Format("2006-01-02-15")
	key := fmt.Sprintf("cpu_util_samples/%s/%d", hourBucket, now.UnixMilli())

	if err := client.NewRef(key).Set(ctx, sample); err != nil {
		return fmt.Errorf("writing cpu utilisation: %w", err)
	}
	return nil
}
