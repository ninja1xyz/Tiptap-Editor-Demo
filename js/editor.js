import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import CustomImage from './custom-image.js'
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
import MarkdownIt from 'markdown-it'

/**
 * Initialize the Tiptap editor with extensions
 */
class TiptapEditor {
  constructor() {
    this.editor = null;
    this.markdownModal = null;
    this.markdownOutput = null;
    this.closeModalBtn = null;
    this.copyMarkdownBtn = null;
    this.downloadMarkdownBtn = null;
    this.turndownService = null;
    this.notificationTimeout = null;
    this.isTableInsertInProgress = false;
    this.initialize();
    this.setupEventListeners();
  }

  /**
   * Initialize the Tiptap editor with all extensions
   */
  initialize() {
    // Create a lowlight instance with common languages
    const lowlight = createLowlight(common);

    try {
      // Initialize the editor with proper configuration
      this.editor = new Editor({
        element: document.querySelector('.editor'),
        extensions: [
          StarterKit.configure({
            codeBlock: false,
            // Explicitly include these to avoid duplicates
            horizontalRule: true,
            hardBreak: true,
            strike: true
          }),
          CustomImage,
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
          // Do not include these as they're part of StarterKit
          // HorizontalRule,
          // HardBreak,
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
        }
      });

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

      // Reset any lingering file dialogs
      window._activeFileDialogs = [];

      // Add notification container to the page if it doesn't exist
      if (!document.getElementById('tiptap-notification')) {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'tiptap-notification';
        notificationContainer.style.display = 'none';
        document.body.appendChild(notificationContainer);
      }
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
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
        const headers = Array.from(node.querySelectorAll('thead > tr > th, tr:first-child > th')).map(th => {
          // Clean up the text content
          return th.textContent.trim() || ' ';
        });
        
        // If no headers, create empty ones based on the number of columns in first row
        let headerRow = [];
        if (headers.length === 0) {
          const firstRow = node.querySelector('tr');
          if (firstRow) {
            const cellCount = firstRow.querySelectorAll('td').length;
            headerRow = Array(cellCount).fill(' ');
          } else {
            headerRow = [' '];
          }
        } else {
          headerRow = headers;
        }
        
        // Create the markdown table header
        let markdown = '| ' + headerRow.join(' | ') + ' |\n';
        markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';
        
        // Process the table rows (exclude header row if it exists)
        let rows;
        if (node.querySelector('thead')) {
          // If we have a thead, get all rows from tbody
          rows = Array.from(node.querySelectorAll('tbody > tr'));
        } else {
          // Otherwise, get all rows except the first one (assuming it contains headers)
          rows = Array.from(node.querySelectorAll('tr')).slice(headers.length > 0 ? 1 : 0);
        }
        
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => {
            // Clean up the text content
            return td.textContent.trim() || ' ';
          });
          
          // If the row doesn't have enough cells to match the headers, pad with empty cells
          while (cells.length < headerRow.length) {
            cells.push(' ');
          }
          
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

    // Custom rule for images
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: function(content, node) {
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        const title = node.getAttribute('title') ? ` "${node.getAttribute('title')}"` : '';
        return `![${alt}](${src}${title})`;
      }
    });
  }

  /**
   * Set up event listeners for the toolbar buttons, modal, etc.
   */
  setupEventListeners() {
    // Event listeners for regular buttons
    document.querySelectorAll('.menu-bar button:not(.dropdown-toggle)').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        
        if (action) {
          this.executeAction(action, button);
        }
      });
    });

    // Enhance dropdown behavior for better UX
    this.setupEnhancedDropdowns();

    // Event listeners for dropdown buttons
    document.querySelectorAll('.dropdown-menu button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the event from bubbling up
        const action = button.dataset.action;
        
        if (action) {
          this.executeAction(action, button);
        }
      });
    });

    // Wait for editor to be fully initialized before updating menu state
    if (this.editor) {
      // Ensure the editor is ready before updating menu state
      this.editor.on('ready', () => {
        this.updateMenuState();
      });
      
      // Update active states on every transaction
      this.editor.on('transaction', () => {
        this.updateMenuState();
      });
    } else {
      console.warn('Editor not initialized when setting up event listeners');
    }

    // Modal close button
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => {
        this.markdownModal.style.display = 'none';
      });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
      if (this.markdownModal && event.target === this.markdownModal) {
        this.markdownModal.style.display = 'none';
      }
    });

    // Copy markdown to clipboard
    if (this.copyMarkdownBtn) {
      this.copyMarkdownBtn.addEventListener('click', () => {
        if (this.markdownOutput) {
          navigator.clipboard.writeText(this.markdownOutput.textContent)
            .then(() => {
              this.showNotification('Markdown copied to clipboard!', 'success');
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
              this.showNotification('Failed to copy to clipboard', 'error');
            });
        }
      });
    }

    // Download markdown as file
    if (this.downloadMarkdownBtn) {
      this.downloadMarkdownBtn.addEventListener('click', () => {
        if (this.markdownOutput) {
          const markdown = this.markdownOutput.textContent;
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.md';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  }

  /**
   * Setup enhanced dropdown behavior for better UX
   */
  setupEnhancedDropdowns() {
    // Add click-to-toggle functionality for dropdowns
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      // Track open/closed state for each dropdown
      toggle.setAttribute('aria-expanded', 'false');
      
      // Add click handler to toggle dropdown
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle dropdown visibility
        const dropdown = toggle.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Close all other open dropdowns first
        document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach(openToggle => {
          if (openToggle !== toggle) {
            openToggle.setAttribute('aria-expanded', 'false');
            const openMenu = openToggle.parentElement.querySelector('.dropdown-menu');
            openMenu.style.display = '';
            openMenu.style.opacity = '';
            openMenu.style.visibility = '';
            openMenu.style.pointerEvents = '';
            openMenu.style.transform = '';
          }
        });
        
        // Toggle current dropdown
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        
        if (!isExpanded) {
          // Show dropdown
          menu.style.display = 'block';
          menu.style.opacity = '1';
          menu.style.visibility = 'visible';
          menu.style.pointerEvents = 'auto';
          menu.style.transform = 'translateY(0)';
          
          // Set focus on first menu item
          setTimeout(() => {
            const firstItem = menu.querySelector('button');
            if (firstItem) firstItem.focus();
          }, 10);
        } else {
          // Hide dropdown
          menu.style.display = '';
          menu.style.opacity = '';
          menu.style.visibility = '';
          menu.style.pointerEvents = '';
          menu.style.transform = '';
        }
      });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach(toggle => {
          toggle.setAttribute('aria-expanded', 'false');
          const menu = toggle.parentElement.querySelector('.dropdown-menu');
          menu.style.display = '';
          menu.style.opacity = '';
          menu.style.visibility = '';
          menu.style.pointerEvents = '';
          menu.style.transform = '';
        });
      }
    });
    
    // Add keyboard navigation for accessibility
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          // Close dropdown on escape
          const toggle = menu.parentElement.querySelector('.dropdown-toggle');
          toggle.setAttribute('aria-expanded', 'false');
          menu.style.display = '';
          menu.style.opacity = '';
          menu.style.visibility = '';
          menu.style.pointerEvents = '';
          menu.style.transform = '';
          toggle.focus();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          
          // Navigate between menu items
          const items = Array.from(menu.querySelectorAll('button'));
          const currentIndex = items.indexOf(document.activeElement);
          let nextIndex;
          
          if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          
          items[nextIndex].focus();
        }
      });
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
   * Close all open dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach(toggle => {
      toggle.setAttribute('aria-expanded', 'false');
      const menu = toggle.parentElement.querySelector('.dropdown-menu');
      if (menu) {
        menu.style.display = '';
        menu.style.opacity = '';
        menu.style.visibility = '';
        menu.style.pointerEvents = '';
        menu.style.transform = '';
      }
    });
  }

  /**
   * Show the markdown export modal with converted content
   */
  showMarkdownExport() {
    // Close any open dropdowns first
    this.closeAllDropdowns();
    
    const markdown = this.convertToMarkdown();
    this.markdownOutput.textContent = markdown;
    this.markdownModal.style.display = 'block';
  }

  /**
   * Execute the appropriate editor command based on the clicked button
   * @param {string} action - The action to execute
   * @param {HTMLElement} button - The button element that was clicked
   */
  executeAction(action, button) {
    // For actions triggered from dropdown menus, close the dropdown first
    // to prevent any race conditions or double execution
    if (button.closest('.dropdown-menu')) {
      // Wait a moment before closing dropdown to prevent race conditions
      requestAnimationFrame(() => {
        this.closeAllDropdowns();
      });
    } else {
      // For non-dropdown buttons, close dropdowns immediately
      this.closeAllDropdowns();
    }
    
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
        // Prevent double execution
        if (this.isTableInsertInProgress) {
          return;
        }
        
        try {
          
          // Set the flag to prevent double execution
          this.isTableInsertInProgress = true;
          
          // Insert the table with standard dimensions
          this.editor.chain()
            .focus()
            .insertTable({
              rows: 3,
              cols: 3,
              withHeaderRow: true
            })
            .run();
        } catch (error) {
          console.error('Error inserting table:', error);
        } finally {
          setTimeout(() => {
            this.isTableInsertInProgress = false;
          }, 300);
        }
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
        // Use a safe, isolated approach to file selection
        this.safelyOpenFileDialog('image/*', (file) => {
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const altText = prompt('Enter alt text for the image (for accessibility):', '');
              this.editor.chain().focus().setImage({ 
                src: e.target.result,
                alt: altText || ''
              }).run();
            };
            reader.readAsDataURL(file);
          } else if (file) {
            this.showNotification('Selected file is not an image', 'error');
          }
        });
        break;
        
      // Export
      case 'exportMarkdown':
        this.showMarkdownExport();
        break;
      
      // Import
      case 'importMarkdown':
        // Use the same safe approach for markdown import
        this.safelyOpenFileDialog('.md,.markdown,text/markdown', (file) => {
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                this.importMarkdown(e.target.result);
                this.showNotification(`File "${file.name}" imported successfully`, 'success');
              } catch (error) {
                console.error('Error importing markdown:', error);
                this.showNotification('Error importing markdown file', 'error');
              }
            };
            reader.onerror = () => {
              console.error('Error reading the markdown file');
              this.showNotification('Error reading the file', 'error');
            };
            reader.readAsText(file);
          }
        });
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
   * Safely open a file dialog without risk of multiple triggers
   * @param {string} accept - File types to accept
   * @param {Function} callback - Callback to run with the selected file
   */
  safelyOpenFileDialog(accept, callback) {
    // Close any open dropdowns first
    this.closeAllDropdowns();
    
    // Create a unique key for this file dialog to prevent duplicates
    const dialogKey = `file_dialog_${Date.now()}`;
    
    // Track active file dialogs to prevent duplicates
    if (window._activeFileDialogs && window._activeFileDialogs.length > 0) {
      // Prevent opening multiple file dialogs
      return;
    }
    
    // Initialize tracking if needed
    if (!window._activeFileDialogs) {
      window._activeFileDialogs = [];
    }
    
    // Add this dialog to active tracking
    window._activeFileDialogs.push(dialogKey);
    
    // Create a new file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.id = dialogKey;
    input.style.display = 'none';
    
    // Add the input to the DOM
    document.body.appendChild(input);
    
    // Set up the change event with cleanup
    input.addEventListener('change', (event) => {
      const file = event.target.files[0];
      
      // Run the callback with the file
      if (callback && typeof callback === 'function') {
        callback(file);
      }
      
      // Clean up - remove the input element after use
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
        
        // Remove from active tracking
        window._activeFileDialogs = window._activeFileDialogs.filter(key => key !== dialogKey);
      }, 100);
    }, { once: true }); // Use once: true to ensure the event only fires once
    
    // Handle the case where dialog is closed without selecting a file
    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      
      // Remove from active tracking
      window._activeFileDialogs = window._activeFileDialogs.filter(key => key !== dialogKey);
    };
    
    // Also set up cleanup on cancel/close
    const cleanupTimeout = setTimeout(() => {
      cleanup();
    }, 60000); // Clean up after a minute if no selection
    
    // Set up a blur listener to clean up if dialog is closed without selecting
    window.addEventListener('focus', () => {
      setTimeout(() => {
        // If the input is still there and has no files, remove it
        if (document.body.contains(input) && (!input.files || input.files.length === 0)) {
          cleanup();
          clearTimeout(cleanupTimeout);
        }
      }, 1000); // Wait a second after focus returns to the window
    }, { once: true });
    
    // Trigger click after a short delay to prevent event conflicts
    setTimeout(() => {
      input.click();
    }, 50);
  }

  /**
   * Update the active state of menu buttons based on current editor state
   */
  updateMenuState() {
    // Check if editor is defined and has a valid state
    if (!this.editor || !this.editor.state || typeof this.editor.isActive !== 'function') {
      console.warn('Editor not fully initialized when updating menu state');
      return;
    }
    
    // Use the editor's isActive method instead of accessing state directly
    // Text formatting options
    document.querySelectorAll('button[data-action="bold"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('bold'))
    );
    document.querySelectorAll('button[data-action="italic"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('italic'))
    );
    document.querySelectorAll('button[data-action="strike"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('strike'))
    );
    document.querySelectorAll('button[data-action="underline"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('underline'))
    );
    document.querySelectorAll('button[data-action="highlight"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('highlight'))
    );
    document.querySelectorAll('button[data-action="link"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('link'))
    );
    document.querySelectorAll('button[data-action="subscript"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('subscript'))
    );
    document.querySelectorAll('button[data-action="superscript"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('superscript'))
    );
    
    // Heading options
    document.querySelectorAll('button[data-action="heading"]').forEach(button => {
      const level = parseInt(button.dataset.level || '1');
      button.classList.toggle('is-active', this.editor.isActive('heading', { level }));
    });
    
    // Update heading dropdown toggle state
    const headingToggle = document.querySelector('.dropdown-toggle[title="Headings"]');
    if (headingToggle) {
      const isAnyHeadingActive = [1, 2, 3].some(level => this.editor.isActive('heading', { level }));
      headingToggle.classList.toggle('is-active', isAnyHeadingActive);
    }
    
    // Lists
    document.querySelectorAll('button[data-action="bulletList"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('bulletList'))
    );
    document.querySelectorAll('button[data-action="orderedList"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('orderedList'))
    );
    document.querySelectorAll('button[data-action="taskList"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('taskList'))
    );
    
    // Block elements
    document.querySelectorAll('button[data-action="blockquote"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('blockquote'))
    );
    document.querySelectorAll('button[data-action="codeBlock"]').forEach(
      button => button.classList.toggle('is-active', this.editor.isActive('codeBlock'))
    );
    
    // Table dropdown toggle
    const tableToggle = document.querySelector('.dropdown-toggle[title="Table"]');
    if (tableToggle) {
      tableToggle.classList.toggle('is-active', this.editor.isActive('table'));
    }
    
    // Text style dropdown toggle
    const textStyleToggle = document.querySelector('.dropdown-toggle[title="Text Style"]');
    if (textStyleToggle) {
      const isAnyTextStyleActive = this.editor.isActive('subscript') || this.editor.isActive('superscript');
      textStyleToggle.classList.toggle('is-active', isAnyTextStyleActive);
    }
  }

  /**
   * Prompt for YouTube URL and insert video
   */
  promptForYoutubeUrl() {
    // Close any open dropdowns first
    this.closeAllDropdowns();
    
    const url = prompt('Enter YouTube URL:');
    
    if (url) {
      try {
        // Insert the YouTube video
        this.editor.commands.createParagraphNear();
        
        this.editor.commands.setYoutubeVideo({
          src: url,
          width: 640,
          height: 360
        });
      } catch (error) {
        console.error('Error inserting YouTube video:', error);
        this.showNotification('Error inserting YouTube video. Please try again.', 'error');
      }
    }
  }

  /**
   * Show a notification message to the user
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (success, error, info)
   */
  showNotification(message, type = 'info') {
    const notification = document.getElementById('tiptap-notification');
    
    // Clear any existing timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = '';
    notification.classList.add('tiptap-notification', `notification-${type}`);
    notification.style.display = 'block';
    
    // Hide notification after a delay
    this.notificationTimeout = setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  /**
   * Import markdown content into the editor
   * @param {string} markdown - The markdown content to import
   */
  importMarkdown(markdown) {
    try {
      // Initialize markdown-it parser
      const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
        typographer: true
      });
      
      // Convert markdown to HTML
      const html = md.render(markdown);
      
      // Set content to the editor
      this.editor.commands.setContent(html);
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      throw new Error('Failed to import markdown');
    }
  }
}

// Initialize the editor when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TiptapEditor();
}); 