# DSGridOrTable Plugin Usage

A flexible data display plugin for Laravel/Blade applications supporting **Table**, **Grid**, or switchable (**Gridable**) layouts. Built on top of DSTable architecture with extended rendering capabilities.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Display Modes](#display-modes)
- [Configuration Options](#configuration-options)
- [Templates](#templates)
- [Backend Response Format](#backend-response-format)
- [Events](#events)
- [Methods](#methods)
- [Examples](#examples)

---

## Installation

Import the plugin in your JavaScript file:

```javascript
import DSGridOrTable from '../../../Plugins/DSGridOrTable.js';
// Or for global usage:
import { DSGridOrTable } from '../../../Plugins/DSGridOrTable.js';
window.DSGridOrTable = DSGridOrTable;
```

---

## Quick Start

### Basic Table Mode

```javascript
const table = new DSGridOrTable('#dataContainer', {
    type: 'table',
    ajax_url: '/api/data',
    rowTemplate: { 
        source: 'response', 
        response: 'html' 
    }
});
```

### Basic Grid Mode

```javascript
const grid = new DSGridOrTable('#dataContainer', {
    type: 'grid',
    ajax_url: '/api/data',
    gridTemplate: { 
        source: 'response', 
        response: 'grid_html' 
    }
});
```

### Gridable Mode (Switchable)

```javascript
const gridable = new DSGridOrTable('#dataContainer', {
    type: 'gridable',
    ajax_url: '/api/data',
    defaultView: 'grid',
    showToggle: true,
    rowTemplate: { 
        source: 'response', 
        response: 'html' 
    },
    gridTemplate: { 
        source: 'response', 
        response: 'grid_html' 
    }
});
```

---

## Display Modes

| Mode | Description | Templates Required |
|------|-------------|-------------------|
| `table` | Standard HTML table with `<tr>` rows | `rowTemplate` |
| `grid` | CSS Grid of cards/divs | `gridTemplate` |
| `gridable` | Toggle between table and grid views | `rowTemplate` + `gridTemplate` |

---

## Configuration Options

### Display Options

```javascript
{
    // Display mode: 'table' | 'grid' | 'gridable'
    type: 'gridable',
    
    // Default view for gridable mode: 'grid' | 'table'
    defaultView: 'grid',
    
    // Show view toggle buttons (gridable mode only)
    showToggle: true,
}
```

### Data Source Options

```javascript
{
    // Data source type: 'ajax' | 'html' | 'json'
    table_source: 'ajax',
    
    // AJAX configuration
    ajax_url: '/api/data',
    ajax_method: 'GET',                    // 'GET' | 'POST'
    ajax_data: {},                         // Additional data to send
    ajax_function: 'axios',                // 'axios' | 'fetch' | 'xhr'
}
```

### Template Configuration

```javascript
{
    // Row template for table mode
    rowTemplate: {
        source: 'response',                // 'function' | 'html' | 'response'
        response: 'html',                  // Property path in response data
        function: null,                    // (row, index) => '<tr>...</tr>'
        html: null                         // Template string with {{field}}
    },
    
    // Grid template for grid mode
    gridTemplate: {
        source: 'response',
        response: 'grid_html',
        function: null,
        html: null
    },
}
```

### Grid Layout Options

```javascript
{
    // Responsive grid columns
    gridColumns: {
        default: 2,                        // Default columns
        sm: 1,                             // Small screens
        md: 2,                             // Medium screens
        lg: 3,                             // Large screens
        xl: 4                              // Extra large screens
    },
    
    // Grid gap (Tailwind gap value)
    gridGap: 4,                            // gap-4
    
    // Grid container CSS class
    gridContainerClass: 'ds-grid-container',
}
```

### Feature Toggles

```javascript
{
    pagination: true,                      // Enable pagination
    search: true,                          // Enable search
    sort: true,                            // Enable column sorting
    filter: true,                          // Enable filters
    export: true,                          // Enable export
    selection: true,                       // Enable row/card selection
    
    // Optional: Filter reset button selector
    // When provided, the button will automatically:
    // - Be enabled/disabled based on active filter state
    // - Clear all filters on click
    filter_reset_button: '#clear-filters-btn',
}
```

### Selectors

```javascript
{
    tableSelector: 'table',                // Table element selector
    bodySelector: 'tbody',                 // Table body selector
    gridSelector: '.ds-grid-container',    // Grid container selector
    toggleSelector: '.ds-view-toggle',     // View toggle selector
    search_selector: '#searchInput',       // Search input selector
}
```

### Messages

```javascript
{
    emptyMessage: 'No data found',
    emptyIcon: 'search_off',               // Material Symbol icon
    errorMessage: 'Error loading data',
}
```

### Callbacks

```javascript
{
    success: (response) => {},             // Called on successful data load
    error: (error) => {},                  // Called on error
    beforeSend: ({ params }) => {},        // Called before AJAX request
    afterSend: (response) => {},           // Called after AJAX response
}
```

---

## Templates

### Using Response Templates (Recommended)

Your backend returns HTML for each row/card:

```php
// Laravel Controller
public function filter(Request $request)
{
    $items = Model::paginate($request->per_page);
    
    $data = $items->getCollection()->transform(function ($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
            // Table row HTML
            'html' => view('tables.row', compact('item'))->render(),
            // Grid card HTML
            'grid_html' => view('cards.item', compact('item'))->render(),
        ];
    });
    
    return response()->json([
        'success' => true,
        'data' => $data,
        'meta' => [
            'current_page' => $items->currentPage(),
            'last_page' => $items->lastPage(),
            'total' => $items->total(),
            'from' => $items->firstItem(),
            'to' => $items->lastItem(),
        ]
    ]);
}
```

### Using Function Templates

```javascript
const grid = new DSGridOrTable('#container', {
    type: 'grid',
    ajax_url: '/api/items',
    gridTemplate: {
        source: 'function',
        function: (row, index) => `
            <div class="card bg-base-100 border p-4">
                <h3 class="font-bold">${row.name}</h3>
                <p>${row.description}</p>
            </div>
        `
    }
});
```

### Using HTML Templates with Placeholders

```javascript
const table = new DSGridOrTable('#container', {
    type: 'table',
    ajax_url: '/api/items',
    rowTemplate: {
        source: 'html',
        html: '<td>{{id}}</td><td>{{name}}</td><td>{{status}}</td>'
    }
});
```

---

## Backend Response Format

### Standard Response Structure

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Item 1",
            "html": "<tr><td>1</td><td>Item 1</td></tr>",
            "grid_html": "<div class='card'>...</div>"
        },
        {
            "id": 2,
            "name": "Item 2",
            "html": "<tr><td>2</td><td>Item 2</td></tr>",
            "grid_html": "<div class='card'>...</div>"
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "total": 50,
        "per_page": 10,
        "from": 1,
        "to": 10
    }
}
```

---

## Events

### Available Events

| Event | Description | Detail |
|-------|-------------|--------|
| `dsgot:dataLoaded` | Fired when data is loaded | `{ response }` |
| `dsgot:render` | Fired after rendering | `{}` |
| `dsgot:viewChange` | Fired when view changes (gridable) | `{ view: 'grid'/'table' }` |
| `dstable:filters-cleared` | Fired when all filters are cleared via `clearFilters()` | `{}` |

### Listening to Events

```javascript
const grid = new DSGridOrTable('#container', { /* config */ });

// Using the on() method
grid.on('dataLoaded', (e) => {
    console.log('Data loaded:', e.detail);
});

grid.on('viewChange', (e) => {
    console.log('View changed to:', e.detail.view);
});

grid.on('render', () => {
    // Re-initialize tooltips, etc.
    tippy('[data-tippy-content]');
});

// Using DOM event listeners
document.querySelector('#container').addEventListener('dsgot:render', () => {
    console.log('Rendered!');
});
```

---

## Methods

### Data Methods

```javascript
// Refresh data (resets to page 1)
grid.refresh();

// Load data with current params
grid.loadData();

// Set parameter
grid.setParam('page', 2);
grid.setParam('search', 'keyword');

// Get parameter
const page = grid.getParam('page');
```

### View Methods (Gridable Mode)

```javascript
// Switch to specific view
grid.setView('grid');
grid.setView('table');

// Toggle between views
grid.toggleView();

// Get current view
const currentView = grid.getView(); // 'grid' or 'table'
```

### Utility Methods

```javascript
// Get current render target element
const target = grid.getRenderTarget();

// Register custom module
grid.registerModule('myModule', myModuleInstance);
```

### Filter Module Methods

The filter module provides methods to programmatically control filters:

```javascript
// Access the filter module
const filterModule = grid.modules.filter;

// Check if any filter has an active value
const hasFilters = filterModule.hasActiveFilters();

// Clear all filters and reload data
filterModule.clearFilters(true);  // true = reload data after clearing

// Clear all filters without reloading (useful for batch operations)
filterModule.clearFilters(false);

// Reset a specific filter by key
filterModule.resetFilter('status');           // Reset without reload
filterModule.resetFilter('category', true);   // Reset and reload
```

### Filter Reset Button (Recommended)

The simplest way to add a "Clear Filters" button - just add the config option and the module handles everything automatically:

```html
<!-- Blade Template -->
<button id="clear-filters-btn" class="btn btn-ghost" disabled>
    <span class="material-symbols-outlined">filter_alt_off</span>
</button>
```

```javascript
// JavaScript - Just add the config option!
const grid = new DSGridOrTable('#container', {
    ajax_url: '/api/data',
    filter: true,
    filter_selectors: {
        status: { input_selector: '#status-filter' },
        category: { input_selector: '#category-filter' }
    },
    
    // This is all you need! The module handles:
    // - Click handler to clear all filters
    // - Enable/disable state based on active filters
    // - Automatic state updates on filter changes
    filter_reset_button: '#clear-filters-btn'
});
```

### Manual Filter Reset Button (Alternative)

If you need custom behavior, you can handle it manually:

```javascript
// Listen for filters cleared event
wrapper.addEventListener('dstable:filters-cleared', () => {
    console.log('All filters have been cleared');
});

// Programmatically clear filters
document.querySelector('#my-custom-btn').addEventListener('click', () => {
    grid.modules.filter.clearFilters(true);
});
```

---

## Examples

### Example 1: Domain Logos Grid

```html
<!-- Blade Template -->
<div id="domainLogosGrid" data-url="{{ route('dashboard.tools.domain-logos.filter') }}">
    {{-- Hidden table for DSTable pagination compatibility --}}
    <table class="table hidden">
        <thead><tr><th>Domain</th></tr></thead>
        <tbody></tbody>
    </table>
    
    {{-- Grid container --}}
    <div class="ds-grid-container p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {{-- Rendered via AJAX --}}
    </div>
    
    <div class="ds-table-pagination"></div>
</div>
```

```javascript
// JavaScript
import DSGridOrTable from '../../../Plugins/DSGridOrTable.js';

const domainLogos = new DSGridOrTable('#domainLogosGrid', {
    type: 'grid',
    ajax_url: document.querySelector('#domainLogosGrid').dataset.url,
    search: true,
    search_selector: '#searchInput',
    gridTemplate: {
        source: 'response',
        response: 'grid_html'
    },
    gridColumns: {
        default: 1,
        md: 2,
        lg: 3
    }
});

domainLogos.on('render', () => {
    tippy('[data-tippy-content]', { theme: 'DSTheme' });
});
```

### Example 2: Products with Grid/Table Toggle

```html
<div id="productsDisplay">
    {{-- Toggle will be auto-created or use existing --}}
    <div class="ds-view-toggle join mb-4">
        <button class="btn btn-sm join-item" data-view="grid">
            <span class="material-symbols-outlined">grid_view</span>
        </button>
        <button class="btn btn-sm join-item" data-view="table">
            <span class="material-symbols-outlined">view_list</span>
        </button>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
    
    <div class="ds-grid-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {{-- Grid items --}}
    </div>
    
    <div class="ds-table-pagination"></div>
</div>
```

```javascript
const products = new DSGridOrTable('#productsDisplay', {
    type: 'gridable',
    defaultView: 'grid',
    showToggle: true,
    ajax_url: '/api/products',
    rowTemplate: {
        source: 'response',
        response: 'html'
    },
    gridTemplate: {
        source: 'response',
        response: 'grid_html'
    },
    filter_selectors: {
        category: {
            input_selector: '#categoryFilter'
        },
        status: {
            input_selector: '#statusFilter'
        }
    }
});

// Listen for view changes
products.on('viewChange', (e) => {
    localStorage.setItem('products_view', e.detail.view);
});
```

### Example 3: With Function Templates

```javascript
const users = new DSGridOrTable('#usersContainer', {
    type: 'gridable',
    ajax_url: '/api/users',
    
    rowTemplate: {
        source: 'function',
        function: (user, index) => `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${user.avatar}" class="w-10 h-10 rounded-full"/>
                        <div>
                            <div class="font-bold">${user.name}</div>
                            <div class="text-sm opacity-50">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.role}</td>
                <td><span class="badge badge-${user.status === 'active' ? 'success' : 'ghost'}">${user.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-ghost" onclick="editUser(${user.id})">Edit</button>
                </td>
            </tr>
        `
    },
    
    gridTemplate: {
        source: 'function',
        function: (user, index) => `
            <div class="card bg-base-100 border shadow-sm hover:shadow-lg transition-shadow">
                <figure class="px-4 pt-4">
                    <img src="${user.avatar}" class="rounded-full w-20 h-20"/>
                </figure>
                <div class="card-body items-center text-center">
                    <h2 class="card-title">${user.name}</h2>
                    <p class="text-sm opacity-60">${user.email}</p>
                    <div class="badge badge-${user.status === 'active' ? 'success' : 'ghost'}">${user.status}</div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">Edit</button>
                    </div>
                </div>
            </div>
        `
    }
});
```

---

## Blade Templates

### Row Template (Table Mode)

```blade
{{-- resources/views/tables/product-row.blade.php --}}
<tr>
    <td>
        <div class="flex items-center gap-3">
            <img src="{{ $product->image_url }}" class="w-12 h-12 rounded"/>
            <div>
                <div class="font-bold">{{ $product->name }}</div>
                <div class="text-sm opacity-50">{{ $product->sku }}</div>
            </div>
        </div>
    </td>
    <td>${{ number_format($product->price, 2) }}</td>
    <td>
        <span class="badge badge-{{ $product->stock > 0 ? 'success' : 'error' }}">
            {{ $product->stock > 0 ? 'In Stock' : 'Out of Stock' }}
        </span>
    </td>
    <td>
        <div class="flex gap-1">
            <a href="{{ route('products.edit', $product) }}" class="btn btn-sm btn-ghost">
                <span class="material-symbols-outlined">edit</span>
            </a>
            <button class="btn btn-sm btn-ghost text-error" data-delete="{{ route('products.destroy', $product) }}">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </td>
</tr>
```

### Card Template (Grid Mode)

```blade
{{-- resources/views/cards/product-card.blade.php --}}
<div class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-lg transition-all group">
    <figure class="relative">
        <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="w-full h-40 object-cover"/>
        @if($product->is_new)
            <span class="badge badge-primary absolute top-2 right-2">New</span>
        @endif
    </figure>
    <div class="card-body p-4">
        <h3 class="card-title text-base">{{ $product->name }}</h3>
        <p class="text-sm text-base-content/60 line-clamp-2">{{ $product->description }}</p>
        
        <div class="flex justify-between items-center mt-3">
            <span class="text-xl font-bold text-primary">${{ number_format($product->price, 2) }}</span>
            <span class="badge badge-{{ $product->stock > 0 ? 'success' : 'error' }} badge-sm">
                {{ $product->stock > 0 ? 'In Stock' : 'Out' }}
            </span>
        </div>
        
        <div class="card-actions mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href="{{ route('products.edit', $product) }}" class="btn btn-sm btn-primary flex-1">Edit</a>
            <button class="btn btn-sm btn-ghost text-error" data-delete="{{ route('products.destroy', $product) }}">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    </div>
</div>
```

---

## Tips & Best Practices

1. **Performance**: Use `response` template source for best performance - let the server render HTML.

2. **Consistency**: Keep row and card templates consistent in data display for smooth view transitions.

3. **Accessibility**: Include proper ARIA labels in toggle buttons for screen readers.

4. **Mobile**: Consider using grid-only on mobile for better touch targets.

5. **Events**: Always re-initialize tooltips, dropdowns, etc. on the `render` event.

6. **Skeleton Loading**: The plugin automatically shows appropriate skeleton loaders for each view type.

---

## Migration from DSTable

If you're currently using DSTable and want to switch to DSGridOrTable:

```javascript
// Before (DSTable)
const table = new DSTable('#container', {
    ajax_url: '/api/data',
    template_source: 'response',
    template_response: 'html'
});

// After (DSGridOrTable - table mode)
const table = new DSGridOrTable('#container', {
    type: 'table',
    ajax_url: '/api/data',
    rowTemplate: {
        source: 'response',
        response: 'html'
    }
});
```

The DSGridOrTable plugin is backwards compatible with DSTable events (`dstable:*` events are also emitted).
