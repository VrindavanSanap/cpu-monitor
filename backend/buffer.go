package main

import (
	"sync"
	"time"
)

const bufferWindow = 60 * time.Second

// ringBuffer holds the last 60 seconds of CPU samples in memory.
// Samples are assumed to arrive in chronological order.
type ringBuffer struct {
	mu      sync.RWMutex
	samples []CPUData
}

// add appends a sample and evicts any entries older than bufferWindow.
func (b *ringBuffer) add(d CPUData) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.samples = append(b.samples, d)
	b.evict()
}

// snapshot returns a copy of all samples currently in the window.
func (b *ringBuffer) snapshot() []CPUData {
	b.mu.RLock()
	defer b.mu.RUnlock()
	out := make([]CPUData, len(b.samples))
	copy(out, b.samples)
	return out
}

// evict removes samples that have fallen outside the buffer window.
// Must be called with b.mu held.
func (b *ringBuffer) evict() {
	cutoff := time.Now().UTC().Add(-bufferWindow)
	i := 0
	for i < len(b.samples) && parseRFC3339(b.samples[i].Timestamp).Before(cutoff) {
		i++
	}
	b.samples = b.samples[i:]
}

func parseRFC3339(s string) time.Time {
	t, _ := time.Parse(time.RFC3339, s)
	return t
}
