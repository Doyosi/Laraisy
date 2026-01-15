# DSSvgFetch Usage

`DSSvgFetch` replaces `<img>` tags referencing SVG files with the inline SVG code, allowing for CSS styling of paths.

## Usage

```html
<img src="icon.svg" class="svg-icon" data-src="icon.svg" alt="Icon">

<script>
    import { DSSvgFetch } from '@doyosi/laraisy';
    
    // Convert all images with .svg-icon class
    DSSvgFetch.init('.svg-icon');
</script>
```

## How it works
1. Finds generic elements (usually `<img>` or `<i>`) with the target selector.
2. Fetches the SVG content from the URL.
3. Replaces the element with the raw SVG code.
4. Preserves classes and IDs from the original element.
