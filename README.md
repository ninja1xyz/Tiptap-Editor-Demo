# Tiptap Editor Implementation

A modern, customizable rich text editor implementation using Tiptap with vanilla JavaScript.

## Features

- Rich text editing with a clean and modern UI
- Support for headings, bold, italic, lists, blockquotes, and more
- Image upload and embedding
- Tables with full editing capabilities
- Task lists for interactive checklists
- Code blocks with syntax highlighting
- Horizontal rules and hard breaks
- YouTube video embedding
- @Mentions with suggestions
- Complete text formatting options (bold, italic, strike, highlight, subscript, superscript, underline)
- Link creation and editing
- Markdown export functionality
- Customizable toolbar

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/tiptap-editor.git
cd tiptap-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to the local server (typically http://localhost:5173).

## Building for Production

To build the project for production:

```bash
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static file server.

## Available Extensions

This editor includes the following Tiptap extensions:

### Text Formatting
- Bold - Make text bold
- Italic - Make text italic
- Strikethrough - Add a line through text
- Highlight - Add background color to text
- Subscript - Create smaller text below the line
- Superscript - Create smaller text above the line
- Underline - Add a line under text
- Link - Create hyperlinks

### Block Elements
- Headings (H1, H2, H3)
- Blockquote
- Code Block with syntax highlighting
- Horizontal Rule

### Lists
- Bullet List
- Ordered List
- Task List with checkboxes

### Tables
- Table with header row
- Add/delete rows and columns
- Table cell and header styling

### Media
- Images with upload from device
- YouTube video embedding

### Interactive
- @Mentions with suggestions

## Markdown Export

The editor supports exporting content to Markdown format:

1. Click the "Export MD" button in the toolbar
2. A modal will appear showing the Markdown representation of your content
3. You can:
   - Copy the Markdown to clipboard
   - Download it as a .md file

The Markdown export includes support for:
- Headings, paragraphs, and formatting (bold, italic, strike, highlight, etc.)
- Lists (bullet, ordered, and task lists)
- Tables with proper formatting
- Code blocks with syntax highlighting
- Links and mentions
- Images, blockquotes, and horizontal rules
- YouTube video links
- Subscript and superscript notation

## Customization

### Adding New Extensions

1. Install the extension:
```bash
npm install @tiptap/extension-name
```

2. Import and add it to the editor in `js/editor.js`:
```javascript
import ExtensionName from '@tiptap/extension-name'

// Then add it to the extensions array
extensions: [
  StarterKit,
  ExtensionName,
],
```

### Image Handling

The editor includes basic image upload functionality that allows users to:
- Click the "Image" button in the toolbar
- Select an image from their device
- The image will be embedded in the editor at the current cursor position

To customize the image handling:
- You can modify the `handleImageUpload` method in `js/editor.js`
- To add server uploads, replace the FileReader code with an appropriate fetch/axios request

### Customizing the Toolbar

To add more buttons to the toolbar, modify the HTML in `index.html` and add corresponding event handlers in `js/editor.js`.

## Technologies Used

- [Tiptap](https://tiptap.dev/) - The core editor framework
- [ProseMirror](https://prosemirror.net/) - The underlying technology
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [Vite](https://vitejs.dev/) - Build tool and development server

## License

MIT 