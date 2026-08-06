// Fetch and render the ticker from ticker.json
    async function loadTicker() {
      const track = document.getElementById('marqueeTrack');
      if (!track) return;
      try {
        // Cache buster to always get fresh ticker
        const res = await fetch(`ticker.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to load ticker.json');
        
        const payload = await res.json();
        
        // Handle both new {speed, messages} format and old [...] format
        const data = Array.isArray(payload) ? payload : payload.messages || [];
        const speed = payload.speed || 25; // Default speed if not specified
        
        if (data && data.length > 0) {
          // Calculate a proportional duration based on the number of items
          // So speed remains visually consistent regardless of how many items exist.
          // Formula: user_speed * (data.length / 5) * 5 (since we scroll 5 sets)
          // Actually, if we repeat 10 times, 50% is 5 sets.
          // Base speed is for 5 items. If there are fewer, it should take less total time to cover 50%.
          const setsToScroll = 5; 
          const calculatedDuration = speed * (data.length / 5) * setsToScroll;
          track.style.animationDuration = `${calculatedDuration}s`;
          
          let html = '';
          // Render items 10 times to ensure the track is wider than any screen for a seamless loop
          for (let i = 0; i < 10; i++) {
            data.forEach(item => {
              const icon = item.Icon || '🔔';
              const msg = item.Message || '';
              const link = item.Link || '#';
              html += `<a href="${link}" class="marquee-item">${icon} ${msg}</a><span class="marquee-dot">•</span>`;
            });
          }
          track.innerHTML = html;
        } else {
          track.innerHTML = '<span style="padding: 0 20px; color: #cbd5e1;">No new announcements.</span>';
        }
      } catch (err) {
        console.error('Ticker Error:', err);
        track.innerHTML = '<span style="padding: 0 20px; color: #cbd5e1;">Error loading announcements.</span>';
      }
    }
    
    // Call loadTicker when DOM is ready
    document.addEventListener('DOMContentLoaded', loadTicker);