# DSSimpleSlider Usage Guide

A flexible, customizable slider plugin supporting multiple data sources (ajax, json, html) with auto-play, hover pause, and timer border animation.

## Installation

Import the plugin in your JavaScript file:

```javascript
import { DSSimpleSlider } from '@doyosi/laraisy';
```

## Quick Start

### AJAX Mode (Recommended)

```javascript
const slider = new DSSimpleSlider('#mySlider', {
    source: 'ajax',
    ajax_url: '/api/featured-domains',
    ajax_method: 'GET',
    dataMap: {
        title: 'domain',
        subtitle: 'formatted_price',
        url: 'url'
    },
    autoPlay: true,
    interval: 5000
});
```

### JSON Mode

```javascript
const slider = new DSSimpleSlider('#mySlider', {
    source: 'json',
    data: [
        { title: 'crypto.com', subtitle: '$12,000', url: '/domain/crypto.com' },
        { title: 'ai.io', subtitle: '$8,500', url: '/domain/ai.io' },
        { title: 'pay.app', subtitle: '$15,000', url: '/domain/pay.app' }
    ]
});
```

### HTML Mode (Reads Existing Content)

```javascript
const slider = new DSSimpleSlider('#mySlider', {
    source: 'html'
});
```

## HTML Structure

```html
<div id="mySlider" data-url="/api/data">
    <div class="slider-container">
        <!-- Timer Badge (optional) -->
        <div class="ds-slider-badge">Premium Domains</div>
        
        <!-- Navigation Buttons -->
        <button class="ds-slider-prev">←</button>
        
        <!-- Content Area -->
        <div class="ds-slider-content">
            <div class="ds-slider-title">Loading...</div>
            <div class="ds-slider-subtitle"></div>
        </div>
        
        <button class="ds-slider-next">→</button>
    </div>
</div>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `source` | string | `'json'` | Data source: `'ajax'`, `'json'`, `'html'` |
| `ajax_url` | string | `null` | URL for AJAX requests |
| `ajax_method` | string | `'GET'` | HTTP method (`GET`, `POST`) |
| `ajax_data` | object | `{}` | Additional request parameters |
| `ajax_function` | string | `'axios'` | HTTP library: `'axios'`, `'fetch'`, `'xhr'` |
| `data` | array | `[]` | Slide data for JSON mode |
| `dataMap` | object | `{title, subtitle, url}` | Property mapping |
| `autoPlay` | boolean | `true` | Enable auto-advance |
| `interval` | number | `5000` | Milliseconds between slides |
| `pauseOnHover` | boolean | `true` | Pause on mouse hover |
| `showTimerBorder` | boolean | `true` | Show animated timer border |
| `timerBorderSelector` | string | `'.ds-slider-badge'` | Element for timer animation |
| `timerBorderColor` | string | `'rgba(251, 191, 36, 1)'` | Timer border color |
| `showPrevButton` | boolean | `true` | Show previous button |
| `showNextButton` | boolean | `true` | Show next button |
| `prevButtonSelector` | string | `'.ds-slider-prev'` | Previous button selector |
| `nextButtonSelector` | string | `'.ds-slider-next'` | Next button selector |
| `contentSelector` | string | `'.ds-slider-content'` | Content wrapper selector |
| `titleSelector` | string | `'.ds-slider-title'` | Title element selector |
| `subtitleSelector` | string | `'.ds-slider-subtitle'` | Subtitle element selector |
| `disabledClass` | string | `'opacity-50 pointer-events-none'` | Class for disabled state |
| `onSlideChange` | function | `null` | Callback on slide change |
| `onDataLoad` | function | `null` | Callback after data loads |
| `onEmpty` | function | `null` | Callback when no data |

## Public Methods

```javascript
const slider = new DSSimpleSlider('#mySlider', options);

// Navigation
slider.next();           // Go to next slide
slider.prev();           // Go to previous slide
slider.goTo(2);          // Go to specific slide (0-indexed)

// Playback
slider.play();           // Start auto-play
slider.pause();          // Pause auto-play
slider.resume();         // Resume after pause
slider.stop();           // Stop auto-play completely

// Data
slider.reload();         // Reload data from source
slider.reload(newData);  // Replace with new data
slider.setParams({});    // Set AJAX params and chain
slider.getCurrentSlide(); // Get current slide object
slider.getSlides();      // Get all slides

// Cleanup
slider.destroy();        // Remove all event listeners
```

## Events

```javascript
// Listen via CustomEvent
document.querySelector('#mySlider').addEventListener('dsslider:change', (e) => {
    console.log('Slide changed:', e.detail.slide);
    console.log('Index:', e.detail.index);
    console.log('Total:', e.detail.total);
});

document.querySelector('#mySlider').addEventListener('dsslider:empty', () => {
    console.log('No slides available');
});
```

## Data Map Examples

### Standard API Response

```javascript
// API returns: { data: [{ name: 'domain.com', price: 100 }] }
dataMap: {
    title: 'name',
    subtitle: 'price'
}
```

### Nested Properties

```javascript
// API returns: { data: [{ domain: { name: 'test.com' }, pricing: { display: '$100' } }] }
dataMap: {
    title: 'domain.name',
    subtitle: 'pricing.display'
}
```

## Complete Example

```html
<div id="premiumDomainsSlider" 
     class="relative w-[300px] mx-auto"
     data-url="/api/featured-domains">
    <div class="bg-white rounded-2xl p-4 flex items-center">
        <div class="ds-slider-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full">
            Premium Domains
        </div>
        
        <button class="ds-slider-prev btn btn-circle btn-sm">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>
        
        <div class="ds-slider-content flex-1 text-center">
            <div class="ds-slider-title font-bold text-lg">Loading...</div>
            <div class="ds-slider-subtitle text-emerald-600 text-sm"></div>
        </div>
        
        <button class="ds-slider-next btn btn-circle btn-sm">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>
    </div>
</div>

<script type="module">
import { DSSimpleSlider } from '@doyosi/laraisy';

new DSSimpleSlider('#premiumDomainsSlider', {
    source: 'ajax',
    ajax_url: document.querySelector('#premiumDomainsSlider').dataset.url,
    dataMap: {
        title: 'domain',
        subtitle: 'formatted_price',
        url: 'url'
    },
    autoPlay: true,
    interval: 5000,
    pauseOnHover: true,
    showTimerBorder: true,
    onEmpty: () => {
        document.querySelector('#premiumDomainsSlider').style.display = 'none';
    }
});
</script>
```

## Disabling Features

```javascript
// Disable auto-play
new DSSimpleSlider('#slider', { autoPlay: false });

// Disable timer animation
new DSSimpleSlider('#slider', { showTimerBorder: false });

// Hide navigation buttons  
new DSSimpleSlider('#slider', { 
    showPrevButton: false, 
    showNextButton: false 
});

// Disable hover pause
new DSSimpleSlider('#slider', { pauseOnHover: false });
```
