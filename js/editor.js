import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import CodeBlock from '@tiptap/extension-code-block'
import HardBreak from '@tiptap/extension-hard-break'
import TurndownService from 'turndown'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import YouTube from '@tiptap/extension-youtube'
import Mention from '@tiptap/extension-mention'
import Highlight from '@tiptap/extension-highlight'
import Strike from '@tiptap/extension-strike'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

/**
 * Initialize the Tiptap editor with extensions
 */
class TiptapEditor {
  constructor() {
    this.editor = null;
    this.imageUploadInput = null;
    this.markdownModal = null;
    this.markdownOutput = null;
    this.closeModalBtn = null;
    this.copyMarkdownBtn = null;
    this.downloadMarkdownBtn = null;
    this.turndownService = null;
    this.initialize();
    this.setupEventListeners();
  }

  /**
   * Initialize the Tiptap editor with all extensions
   */
  initialize() {
    // Create a lowlight instance with common languages
    const lowlight = createLowlight(common);

    this.editor = new Editor({
      element: document.querySelector('.editor'),
      extensions: [
        StarterKit.configure({
          codeBlock: false
        }),
        Image,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        HorizontalRule,
        HardBreak,
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: 'javascript',
        }),
        YouTube.configure({
          controls: true,
          nocookie: true,
          progressBarColor: 'white',
          modestBranding: false,
          inline: false,
          HTMLAttributes: {
            class: 'youtube-video-wrapper',
          },
          addPasteHandler: true,
          allowFullscreen: true,
        }),
        Mention.configure({
          HTMLAttributes: {
            class: 'mention',
          },
          suggestion: {
            items: ({ query }) => {
              return [
                'John Doe',
                'Jane Smith',
                'Alex Johnson',
                'Sarah Williams',
                'Michael Brown',
              ]
                .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
                .slice(0, 5);
            },
            render: () => {
              let popup;
              let items;
              
              return {
                onStart: (props) => {
                  items = props.items;
                  
                  popup = document.createElement('div');
                  popup.classList.add('mention-popup');
                  
                  items.forEach((item) => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('mention-item');
                    itemElement.textContent = item;
                    itemElement.addEventListener('click', () => {
                      props.command({ id: item.toLowerCase().replace(/\s/g, '_'), label: item });
                      popup.remove();
                    });
                    
                    popup.appendChild(itemElement);
                  });
                  
                  document.body.appendChild(popup);
                  
                  // Position the popup
                  const coords = props.clientRect();
                  popup.style.position = 'absolute';
                  popup.style.left = `${coords.left}px`;
                  popup.style.top = `${coords.top + coords.height}px`;
                },
                onUpdate: (props) => {
                  items = props.items;
                  
                  // Clear the popup
                  popup.innerHTML = '';
                  
                  items.forEach((item) => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('mention-item');
                    itemElement.textContent = item;
                    itemElement.addEventListener('click', () => {
                      props.command({ id: item.toLowerCase().replace(/\s/g, '_'), label: item });
                      popup.remove();
                    });
                    
                    popup.appendChild(itemElement);
                  });
                  
                  // Position the popup
                  const coords = props.clientRect();
                  popup.style.position = 'absolute';
                  popup.style.left = `${coords.left}px`;
                  popup.style.top = `${coords.top + coords.height}px`;
                },
                onKeyDown: (props) => {
                  const { event } = props;
                  
                  if (event.key === 'Escape') {
                    popup.remove();
                    return true;
                  }
                  
                  return false;
                },
                onExit: () => {
                  if (popup) {
                    popup.remove();
                  }
                }
              };
            },
          },
        }),
        Highlight.configure({
          multicolor: true,
        }),
        Strike,
        Subscript,
        Superscript,
        TextStyle,
        Underline,
        Link.configure({
          openOnClick: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            class: 'custom-link',
          },
        }),
      ],
      content: '',
      autofocus: true,
      editable: true,
      onUpdate: ({ editor }) => {
        // You can handle content updates here
        // For example, save to localStorage or send to a server
        console.log('Content updated:', editor.getHTML());
      }
    });

    // Get reference to the file input element
    this.imageUploadInput = document.getElementById('image-upload');

    // Get references to markdown modal elements
    this.markdownModal = document.getElementById('markdown-modal');
    this.markdownOutput = document.getElementById('markdown-output');
    this.closeModalBtn = document.querySelector('.close');
    this.copyMarkdownBtn = document.getElementById('copy-markdown');
    this.downloadMarkdownBtn = document.getElementById('download-markdown');

    // Initialize Turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });

    // Add custom rules for tables, task lists, etc.
    this.setupTurndownRules();

    // Log when editor is ready
    console.log('Tiptap editor initialized!');
  }

  /**
   * Set up custom turndown rules for proper markdown conversion
   */
  setupTurndownRules() {
    // Custom rule for tables
    this.turndownService.addRule('table', {
      filter: 'table',
      replacement: function(content, node) {
        // Process the table headers
        const headers = Array.from(node.querySelectorAll('th')).map(th => th.textContent.trim());
        
        // Create the markdown table header
        let markdown = '| ' + headers.join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        
        // Process the table rows
        const rows = Array.from(node.querySelectorAll('tr')).slice(headers.length > 0 ? 1 : 0);
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
          markdown += '| ' + cells.join(' | ') + ' |\n';
        });
        
        return '\n' + markdown + '\n';
      }
    });

    // Custom rule for task lists
    this.turndownService.addRule('taskListItems', {
      filter: function(node) {
        return node.nodeName === 'LI' && 
               node.parentNode && 
               node.parentNode.nodeName === 'UL' && 
               node.parentNode.getAttribute('data-type') === 'taskList';
      },
      replacement: function(content, node) {
        const checkbox = node.querySelector('input[type="checkbox"]');
        const isChecked = checkbox && checkbox.checked;
        const taskMark = isChecked ? '[x]' : '[ ]';
        
        // Remove the checkbox text from content if present
        content = content.replace(/^\s*\[\s?[xX]?\s?\]\s*/, '');
        
        return `- ${taskMark} ${content}\n`;
      }
    });

    // Custom rule for code blocks
    this.turndownService.addRule('codeBlocks', {
      filter: function(node) {
        return node.nodeName === 'PRE' && 
               node.firstChild && 
               node.firstChild.nodeName === 'CODE';
      },
      replacement: function(content, node) {
        const code = node.firstChild.textContent;
        const language = node.firstChild.className.replace('language-', '');
        return '\n```' + language + '\n' + code + '\n```\n';
      }
    });

    // Custom rule for YouTube videos
    this.turndownService.addRule('youtube', {
      filter: function(node) {
        return (node.classList && node.classList.contains('youtube-video')) || 
               (node.classList && node.classList.contains('youtube-video-wrapper')) ||
               (node.hasAttribute && node.hasAttribute('data-youtube-video'));
      },
      replacement: function(content, node) {
        const iframe = node.querySelector('iframe');
        if (iframe && iframe.src) {
          const videoId = iframe.src.match(/\/embed\/([^?]+)/)?.[1];
          if (videoId) {
            return `\n\n🎬 YouTube: https://youtu.be/${videoId}\n\n`;
          }
        }
        return '\n\n[YouTube Video]\n\n';
      }
    });

    // Custom rule for mentions
    this.turndownService.addRule('mention', {
      filter: function(node) {
        return node.classList && node.classList.contains('mention');
      },
      replacement: function(content, node) {
        return `@${node.textContent}`;
      }
    });

    // Custom rule for highlighted text
    this.turndownService.addRule('highlight', {
      filter: 'mark',
      replacement: function(content) {
        return `==${content}==`;
      }
    });

    // Custom rule for strikethrough text
    this.turndownService.addRule('strikethrough', {
      filter: ['s', 'strike', 'del'],
      replacement: function(content) {
        return `~~${content}~~`;
      }
    });

    // Custom rule for links
    this.turndownService.addRule('links', {
      filter: function(node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function(content, node) {
        const href = node.getAttribute('href');
        const title = node.title ? ` "${node.title}"` : '';
        return `[${content}](${href}${title})`;
      }
    });

    // Custom rule for subscript
    this.turndownService.addRule('subscript', {
      filter: 'sub',
      replacement: function(content) {
        return `~${content}~`;
      }
    });

    // Custom rule for superscript
    this.turndownService.addRule('superscript', {
      filter: 'sup',
      replacement: function(content) {
        return `^${content}^`;
      }
    });

    // Custom rule for underline
    this.turndownService.addRule('underline', {
      filter: 'u',
      replacement: function(content) {
        return `__${content}__`;
      }
    });
  }

  /**
   * Set up event listeners for the toolbar buttons, modal, etc.
   */
  setupEventListeners() {
    document.querySelectorAll('.menu-bar button').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        
        if (action) {
          this.executeAction(action, button);
        }
      });
    });

    // Handle file selection for image upload
    this.imageUploadInput.addEventListener('change', this.handleImageUpload.bind(this));

    // Update active states initially and on every transaction
    this.updateMenuState();
    this.editor.on('transaction', () => {
      this.updateMenuState();
    });

    // Modal close button
    this.closeModalBtn.addEventListener('click', () => {
      this.markdownModal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
      if (event.target === this.markdownModal) {
        this.markdownModal.style.display = 'none';
      }
    });

    // Copy markdown to clipboard
    this.copyMarkdownBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.markdownOutput.textContent)
        .then(() => {
          alert('Markdown copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    });

    // Download markdown as file
    this.downloadMarkdownBtn.addEventListener('click', () => {
      const markdown = this.markdownOutput.textContent;
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Convert the editor content to Markdown
   * @returns {string} The Markdown representation of the editor content
   */
  convertToMarkdown() {
    const html = this.editor.getHTML();
    return this.turndownService.turndown(html);
  }

  /**
   * Show the markdown export modal with converted content
   */
  showMarkdownExport() {
    const markdown = this.convertToMarkdown();
    this.markdownOutput.textContent = markdown;
    this.markdownModal.style.display = 'block';
  }

  /**
   * Handle image file selection and insertion
   * @param {Event} event - The change event from file input
   */
  handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file || !file.type.startsWith('image/')) {
      console.warn('Selected file is not an image');
      return;
    }

    // Create a FileReader to read the image file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // Insert the image into the editor at current position
      this.editor.chain().focus().setImage({ src: e.target.result }).run();
      
      // Reset the file input so the same file can be selected again
      event.target.value = '';
    };
    
    reader.onerror = () => {
      console.error('Error reading the image file');
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  }

  /**
   * Execute the appropriate editor command based on the clicked button
   * @param {string} action - The action to execute
   * @param {HTMLElement} button - The button element that was clicked
   */
  executeAction(action, button) {
    switch (action) {
      // Text formatting
      case 'bold':
        this.editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        this.editor.chain().focus().toggleItalic().run();
        break;
      case 'strike':
        this.editor.chain().focus().toggleStrike().run();
        break;
      case 'underline':
        this.editor.chain().focus().toggleUnderline().run();
        break;
      case 'highlight':
        this.editor.chain().focus().toggleHighlight().run();
        break;
      case 'subscript':
        this.editor.chain().focus().toggleSubscript().run();
        break;
      case 'superscript':
        this.editor.chain().focus().toggleSuperscript().run();
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          // Check if text is selected
          if (this.editor.view.state.selection.empty) {
            const text = prompt('Enter link text:');
            if (text) {
              this.editor.chain()
                .focus()
                .insertContent(`<a href="${url}" target="_blank">${text}</a>`)
                .run();
            }
          } else {
            this.editor.chain()
              .focus()
              .setLink({ href: url, target: '_blank' })
              .run();
          }
        } else {
          this.editor.chain().focus().unsetLink().run();
        }
        break;
        
      // Headings
      case 'heading':
        const level = parseInt(button.dataset.level || '1');
        this.editor.chain().focus().toggleHeading({ level }).run();
        break;
        
      // Lists
      case 'bulletList':
        this.editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        this.editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        this.editor.chain().focus().toggleTaskList().run();
        break;
        
      // Block elements
      case 'blockquote':
        this.editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        this.editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'horizontalRule':
        this.editor.chain().focus().setHorizontalRule().run();
        break;
        
      // Table
      case 'insertTable':
        this.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'addColumnBefore':
        this.editor.chain().focus().addColumnBefore().run();
        break;
      case 'addColumnAfter':
        this.editor.chain().focus().addColumnAfter().run();
        break;
      case 'addRowBefore':
        this.editor.chain().focus().addRowBefore().run();
        break;
      case 'addRowAfter':
        this.editor.chain().focus().addRowAfter().run();
        break;
      case 'deleteColumn':
        this.editor.chain().focus().deleteColumn().run();
        break;
      case 'deleteRow':
        this.editor.chain().focus().deleteRow().run();
        break;
      case 'deleteTable':
        this.editor.chain().focus().deleteTable().run();
        break;
        
      // Other elements
      case 'hardBreak':
        this.editor.chain().focus().setHardBreak().run();
        break;
      case 'image':
        // Trigger the hidden file input when the image button is clicked
        this.imageUploadInput.click();
        break;
        
      // Export
      case 'exportMarkdown':
        this.showMarkdownExport();
        break;
        
      // History
      case 'undo':
        this.editor.chain().focus().undo().run();
        break;
      case 'redo':
        this.editor.chain().focus().redo().run();
        break;
        
      case 'youtube':
        this.promptForYoutubeUrl();
        break;
      case 'mention':
        this.editor.chain().focus().insertContent('@').run();
        break;
      case 'syntaxHighlight':
        const language = prompt('Enter programming language:', 'javascript');
        if (language) {
          this.editor.chain().focus().toggleCodeBlock({ language }).run();
        }
        break;
        
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  /**
   * Update the active state of menu buttons based on current editor state
   */
  updateMenuState() {
    document.querySelectorAll('.menu-bar button').forEach(button => {
      const action = button.dataset.action;
      
      if (!action) return;

      // Set active state based on current editor state
      let isActive = false;

      switch (action) {
        case 'bold':
          isActive = this.editor.isActive('bold');
          break;
        case 'italic':
          isActive = this.editor.isActive('italic');
          break;
        case 'strike':
          isActive = this.editor.isActive('strike');
          break;
        case 'underline':
          isActive = this.editor.isActive('underline');
          break;
        case 'highlight':
          isActive = this.editor.isActive('highlight');
          break;
        case 'subscript':
          isActive = this.editor.isActive('subscript');
          break;
        case 'superscript':
          isActive = this.editor.isActive('superscript');
          break;
        case 'heading':
          const level = parseInt(button.dataset.level || '1');
          isActive = this.editor.isActive('heading', { level });
          break;
        case 'bulletList':
          isActive = this.editor.isActive('bulletList');
          break;
        case 'orderedList':
          isActive = this.editor.isActive('orderedList');
          break;
        case 'taskList':
          isActive = this.editor.isActive('taskList');
          break;
        case 'blockquote':
          isActive = this.editor.isActive('blockquote');
          break;
        case 'codeBlock':
          isActive = this.editor.isActive('codeBlock');
          break;
        case 'syntaxHighlight':
          isActive = this.editor.isActive('codeBlock');
          break;
        default:
          // For buttons like undo/redo/image/table actions, no active state
          isActive = false;
      }

      // Update button class based on active state
      if (isActive) {
        button.classList.add('is-active');
      } else {
        button.classList.remove('is-active');
      }
    });
  }

  /**
   * Prompt for YouTube URL and insert video
   */
  promptForYoutubeUrl() {
    const url = prompt('Enter YouTube URL:');
    
    if (url) {
      try {
        // According to docs, we should pass the full URL as src
        console.log('Attempting to insert YouTube video with URL:', url);
        
        this.editor.commands.createParagraphNear();
        
        this.editor.commands.setYoutubeVideo({
          src: url,
          width: 640,
          height: 360
        });
        
        // Check if the video was inserted
        setTimeout(() => {
          const content = this.editor.getHTML();
          // Extract video ID from various YouTube URL formats
          const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
          const match = url.match(regExp);
          const videoId = match && match[1] ? match[1] : null;
        }, 50);
      } catch (error) {
        console.error('Error inserting YouTube video:', error);
        alert('Error inserting YouTube video. Please try again.');
      }
    }
  }
}

// Initialize the editor when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TiptapEditor();
}); 