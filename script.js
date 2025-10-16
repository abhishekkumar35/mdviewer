
        class MarkdownViewer {
            constructor() {
                this.uploadArea = document.getElementById('uploadArea');
                this.fileInput = document.getElementById('fileInput');
                this.browseBtn = document.getElementById('browseBtn');
                this.clearBtn = document.getElementById('clearBtn');
                this.fileInfo = document.getElementById('fileInfo');
                this.fileName = document.getElementById('fileName');
                this.fileSize = document.getElementById('fileSize');
                this.fileType = document.getElementById('fileType');
                this.previewArea = document.getElementById('previewArea');
                this.alertContainer = document.getElementById('alertContainer');
                
                this.maxFileSize = 10 * 1024 * 1024; // 10MB
                this.allowedTypes = ['.md', '.markdown'];
                
                this.initEventListeners();
            }
            
            initEventListeners() {
                // File input change
                this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
                
                // Browse button click
                this.browseBtn.addEventListener('click', () => this.fileInput.click());
                
                // Upload area click
                this.uploadArea.addEventListener('click', () => this.fileInput.click());
                
                // Drag and drop events
                this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
                this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
                
                // Clear button
                this.clearBtn.addEventListener('click', () => this.clearFile());
            }
            
            handleDragOver(e) {
                e.preventDefault();
                this.uploadArea.classList.add('dragover');
            }
            
            handleDragLeave(e) {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
            }
            
            handleDrop(e) {
                e.preventDefault();
                this.uploadArea.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processFile(files[0]);
                }
            }
            
            handleFileSelect(e) {
                const file = e.target.files[0];
                if (file) {
                    this.processFile(file);
                }
            }
            
            processFile(file) {
                // Validate file type
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                if (!this.allowedTypes.includes(fileExtension)) {
                    this.showAlert('Please select a valid markdown file (.md or .markdown)', 'danger');
                    return;
                }
                
                // Validate file size
                if (file.size > this.maxFileSize) {
                    this.showAlert('File size too large. Maximum size is 10MB.', 'danger');
                    return;
                }
                
                // Show file info
                this.displayFileInfo(file);
                
                // Read and process file
                this.readFile(file);
            }
            
            displayFileInfo(file) {
                this.fileName.textContent = file.name;
                this.fileSize.textContent = this.formatFileSize(file.size);
                this.fileType.textContent = file.type || 'text/markdown';
                
                this.fileInfo.classList.remove('d-none');
                this.fileInfo.classList.add('fade-in');
                
                this.clearAlerts();
            }
            
            readFile(file) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        const htmlContent = this.parseMarkdown(content);
                        this.displayPreview(htmlContent);
                        this.showAlert('File loaded successfully!', 'success');
                    } catch (error) {
                        this.showAlert('Failed to read file: ' + error.message, 'danger');
                    }
                };
                
                reader.onerror = () => {
                    this.showAlert('Failed to read file', 'danger');
                };
                
                reader.readAsText(file);
            }
            
            parseMarkdown(markdown) {
                let html = markdown;
                
                // Escape HTML characters first
                html = html.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;');
                
                // Headers (H1-H6)
                html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
                html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
                html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
                html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
                html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
                html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
                
                // Horizontal rules
                html = html.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
                
                // Code blocks (triple backticks)
                html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
                
                // Inline code
                html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
                
                // Bold and italic
                html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
                html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
                html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
                html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
                
                // Links
                html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
                
                // Blockquotes
                html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
                
                // Unordered lists
                html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
                
                // Ordered lists
                html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((<li>.*<\/li>\s*)+)/g, function(match) {
                    if (match.includes('<ul>')) return match;
                    return '<ol>' + match + '</ol>';
                });
                
                // Paragraphs (convert double newlines to paragraph breaks)
                html = html.replace(/\n\s*\n/g, '</p><p>');
                html = '<p>' + html + '</p>';
                
                // Clean up empty paragraphs
                html = html.replace(/<p>\s*<\/p>/g, '');
                html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
                html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<hr>)/g, '$1');
                html = html.replace(/(<hr>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<ul>|<ol>|<blockquote>)/g, '$1');
                html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<pre>)/g, '$1');
                html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
                
                // Line breaks
                html = html.replace(/\n/g, '<br>');
                
                return html;
            }
            
            displayPreview(htmlContent) {
                this.previewArea.innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
                this.previewArea.classList.add('fade-in');
            }
            
            clearFile() {
                this.fileInput.value = '';
                this.fileInfo.classList.add('d-none');
                this.previewArea.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-file-markdown" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p class="mt-3">Upload a markdown file to see the preview</p>
                    </div>
                `;
                this.clearAlerts();
            }
            
            showAlert(message, type) {
                const alertHtml = `
                    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                `;
                
                this.alertContainer.innerHTML = alertHtml;
                
                // Auto-hide success alerts after 3 seconds
                if (type === 'success') {
                    setTimeout(() => {
                        const alert = this.alertContainer.querySelector('.alert');
                        if (alert) {
                            $(alert).alert('close');
                        }
                    }, 3000);
                }
            }
            
            clearAlerts() {
                this.alertContainer.innerHTML = '';
            }
            
            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
        }
        
        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            new MarkdownViewer();
        });
    