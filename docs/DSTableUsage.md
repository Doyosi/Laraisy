# DSTable Usage Documentation

## Overview
`DSTable` is a modular, event-driven table plugin designed for modern web applications. It supports pagination, sorting, filtering, exporting, and row selection out of the box.

## Installation

Import the plugin:

```javascript
import { DSTable } from '@doyosi/laraisy';
```

## Basic Usage

HTML requirements:
- A wrapper element containing a `table`.
- The `table` should have a `tbody`.

```html
<div id="users-table-wrapper">
    <div class="flex justify-between mb-4">
        <input type="text" id="search-input" class="input input-bordered" placeholder="Search...">
    </div>
    
    <table class="table w-full">
        <thead>
            <tr>
                <th data-sort="id">ID</th>
                <th data-sort="name">Name</th>
                <th data-sort="email">Email</th>
            </tr>
        </thead>
        <tbody>
            <!-- Rows will be injected here -->
        </tbody>
    </table>
    
    <!-- Pagination container (auto-created if missing, but better to provide) -->
    <div class="ds-table-pagination"></div>
</div>
```

Javascript initialization:

```javascript
const table = new DSTable('#users-table-wrapper', {
    ajax_url: '/api/users',
    ajax_method: 'GET',
    search_selector: '#search-input', // Optional if using default #search
});
```

## Configuration Options

| Option | Type | Default | Description |
|Data Source|
| `table_source` | string | `'ajax'` | Source type: `'ajax'`, `'json'`, or `'html'`. |
| `ajax_url` | string | `null` | URL for Ajax requests. |
| `ajax_method` | string | `'GET'` | HTTP method. |
| `data` | array | `[]` | Local data array if source is `'json'`. |
|Features|
| `pagination` | boolean | `true` | Enable pagination. |
| `search` | boolean | `true` | Enable search module. |
| `sort` | boolean | `true` | Enable sorting. |
| `filter` | boolean | `true` | Enable filtering. |
| `selection` | boolean | `true` | Enable row selection. |
|Selection Persistence|
| `selection_persist` | boolean | `false` | Enable storage persistence for selections. |
| `selection_storage` | string | `'localStorage'` | Storage type: `'localStorage'` or `'sessionStorage'`. |
| `selection_storage_key` | string | auto-generated | Custom key for storage (auto-generates from table ID/URL). |
|Selectors|
| `search_selector` | string | `null` | Query selector for search input. |
| `filter_selectors` | object | `{}` | Configuration for filters (see below). |
|Templating|
| `template_source` | string | `'html'` | `'function'`, `'html'`, or `'response'`. |
| `template_html` | string | `null` | HTML string with `{{ key }}` placeholders. |
| `template_function` | function | `null` | Function returning row HTML: `(row, index) => html`. |
| `template_response` | string | `'html_response'` | Field name in data object containing pre-rendered HTML. |
|Icons|
| `emptyIcon` | string | `'search_off'` | Icon shown when table has no data. |
| `errorIcon` | string | `'error'` | Icon shown when data loading fails. |
| `iconLibrary` | string | `'material-symbols'` | Icon library: `'material-symbols'`, `'font-awesome'`, `'heroicons'`, `'custom'`. |

## Icons Configuration

DSTable supports multiple icon libraries for the empty state and error icons.

### Using Material Symbols (Default)
```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    emptyIcon: 'search_off',
    errorIcon: 'error'
});
```

### Using Font Awesome
```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    iconLibrary: 'font-awesome',
    emptyIcon: 'folder-open',      // Renders as 'fas fa-folder-open'
    errorIcon: 'exclamation-circle' // Renders as 'fas fa-exclamation-circle'
});
```

### Using Heroicons
```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    iconLibrary: 'heroicons',
    emptyIcon: 'inbox',
    errorIcon: 'exclamation-triangle'
});
```

### Using Phosphor Icons
```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    iconLibrary: 'phosphor',
    emptyIcon: 'magnifying-glass',  // Renders as 'ph ph-magnifying-glass'
    errorIcon: 'warning-circle'     // Renders as 'ph ph-warning-circle'
});
```

### Using Custom HTML/SVG
```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    iconLibrary: 'custom',
    emptyIcon: '<svg class="w-12 h-12" ...>...</svg>',
    errorIcon: '<svg class="w-12 h-12" ...>...</svg>'
});
```


## Filters
Define filters in the `filter_selectors` object. Supports standard inputs, selects, and custom DSSelect (searchable-select) components:

```javascript
filter_selectors: {
    status: { 
        input_selector: '#status-filter', 
        default_value: 'active' 
    },
    category: {
        input_selector: '#category-filter', // Standard select
        default_value: null
    },
    owner_id: {
        input_selector: '#owner-filter',    // DSSelect (searchable-select)
        default_value: null
    },
    tlds: {
        input_selector: '#tld-filter',      // DSSelect with multiple
        default_value: null
    }
}
```

> **Note:** DSSelect components automatically dispatch `dsselect:change` events which DSTableFilter listens for.

## Submodules

### Search
Automatically binds to the input specified by `search_selector` (or `#search` by default). Debounced by 500ms.

### Sort
Add `data-sort="column_name"` to table headers. Clicking toggles `asc`/`desc`.

### Selection
Add `input.select-row` checkboxes to your row template.
Add `input.select-all` to your header.

```html
<!-- Header -->
<th><input type="checkbox" class="select-all checkbox"></th>

<!-- Row Template -->
<td><input type="checkbox" class="select-row checkbox" value="{{ id }}"></td>
```

#### Selection Persistence
Enable persistence to save selections across page reloads:

```javascript
const table = new DSTable('#table-wrapper', {
    ajax_url: '/api/data',
    selection_persist: true,
    selection_storage: 'sessionStorage', // or 'localStorage'
    selection_storage_key: 'my_selections'
});
```

#### Selection API

```javascript
// Get all selected IDs
table.modules.selection.getSelected(); // ['1', '5', '10']

// Set selected IDs programmatically
table.modules.selection.setSelected(['1', '2', '3']);

// Clear all selections (including storage)
table.modules.selection.clearAll();

// Check if specific ID is selected
table.modules.selection.isSelected('5'); // true/false
```

## Events
Listen to events on the wrapper element:

- `dstable:ready`: Plugin initialized.
- `dstable:dataLoaded`: Data fetched successfully.
- `dstable:render`: Rows rendered.
- `dstable:selectionChange`: Row selection changed.

```javascript
document.querySelector('#users-table-wrapper').addEventListener('dstable:selectionChange', (e) => {
    console.log('Selected IDs:', e.detail.selected);
});
```

## UI & UX Enhancements (v1.1)

### Skeleton Loading
The table automatically displays a Skeleton loader while fetching data via Ajax. It mimics the table structure (rows/columns) based on the current page size configuration.

### Smart Pagination
- The button for the currently active page is disabled to prevent redundant data re-fetching.
- Prev/Next buttons are disabled when reaching the start or end of the list.
- **Go To Input**: Added a specific page input to jump directly to any page.

## Backend Requirements
For pagination stats ("Showing X to Y of Z") to work correctly, your JSON response's `meta` object must include:
- `from`: The index of the first item on the current page.
- `to`: The index of the last item on the current page.
- `total`: Total number of items.
(Standard Laravel `paginate()` provides these via `firstItem()` and `lastItem()`).
