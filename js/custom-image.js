import Image from '@tiptap/extension-image'

// Extend the base Image extension to add better alt text support
const CustomImage = Image.extend({
  // Keep the original attributes (src, alt, title) but make alt required for accessibility
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      title: {
        default: null,
      },
    }
  },
  
  // commands to insert an image with alt text
  addCommands() {
    return {
      // Override setImage to add alt text prompt if not provided
      setImage: (attributes) => ({ commands }) => {
        // Use the provided attributes or prompt for missing ones
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    }
  },

  // Add input rules for Markdown ![alt](src) syntax
  addInputRules() {
    return [
      // Match ![alt](src) syntax
      // This is inherited from the base Image extension
    ]
  },
  
  // Add parsing rules for Markdown conversion
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: node => ({
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt') || '',
          title: node.getAttribute('title'),
        }),
      },
    ]
  },
  
  // Add custom nodeview for rendering images with alt text indicator
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('image-wrapper');
      
      // Create the image element
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      if (node.attrs.title) img.title = node.attrs.title;
      dom.appendChild(img);
      
      // Create the alt text indicator
      const altIndicator = document.createElement('div');
      altIndicator.classList.add('image-alt-indicator');
      altIndicator.textContent = node.attrs.alt ? `Alt: ${node.attrs.alt}` : 'No alt text';
      dom.appendChild(altIndicator);
      
      // Create the bubble menu for editing alt text
      const bubbleMenu = document.createElement('div');
      bubbleMenu.classList.add('image-bubble-menu');
      
      const editButton = document.createElement('button');
      editButton.innerHTML = '<i class="fas fa-pencil-alt"></i> Edit Alt Text';
      editButton.addEventListener('click', () => {
        const newAlt = prompt('Enter alt text for the image (for accessibility):', node.attrs.alt || '');
        
        if (newAlt !== null) {  // Only update if user didn't cancel
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, {
              ...node.attrs,
              alt: newAlt
            });
            return true;
          });
        }
      });
      
      bubbleMenu.appendChild(editButton);
      dom.appendChild(bubbleMenu);
      
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          
          // Update the attributes
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          if (updatedNode.attrs.title) img.title = updatedNode.attrs.title;
          
          // Update the alt text indicator
          altIndicator.textContent = updatedNode.attrs.alt ? `Alt: ${updatedNode.attrs.alt}` : 'No alt text';
          
          return true;
        },
      };
    };
  },
})

export default CustomImage 