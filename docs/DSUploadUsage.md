# DSUpload Usage

`DSUpload` is a comprehensive file upload component supporting drag-and-drop, image previews, and AJAX uploads.

## Basic Usage

```html
<div class="ds-upload" 
     data-upload-url="/api/upload" 
     data-name="file">
    <!-- UI elements structure expected by DSUpload -->
</div>

<script>
    import { DSUpload } from '@doyosi/laraisy';
    // Automatically initialized on elements with class .ds-upload
    // or manually:
    const uploader = new DSUpload('#my-uploader');
</script>
```

## Configuration (Data Attributes)

- `data-upload-url`: URL for the POST request.
- `data-name`: Name of the file input field (default: 'file').
- `data-size-unit`: 'auto' | 'MB' | 'KB' (default: 'auto').
- `data-max-size`: Maximum file size in bytes.
- `data-accepted-types`: Comma-separated list of accepted mime types.

## Events

- `dsupload:added`: File added to queue.
- `dsupload:success`: Upload successful.
- `dsupload:error`: Upload failed.
