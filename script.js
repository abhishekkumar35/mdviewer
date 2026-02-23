
        class MarkdownViewer {
            constructor() {
                this.uploadSection = document.getElementById('uploadSection');
                this.previewSection = document.getElementById('previewSection');
                this.uploadArea = document.getElementById('uploadArea');
                this.fileInput = document.getElementById('fileInput');
                this.browseBtn = document.getElementById('browseBtn');
                this.clearBtnTop = document.getElementById('clearBtnTop');
                this.uploadOtherBtn = document.getElementById('uploadOtherBtn');
                this.previewArea = document.getElementById('previewArea');
                this.alertContainer = document.getElementById('alertContainer');
                
                this.maxFileSize = 10 * 1024 * 1024; // 10MB
                this.allowedTypes = ['.md', '.markdown'];
                
                this.initEventListeners();
            }
            
            initEventListeners() {
                // File input change
                this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
                
                // Browse button click (prevent event bubbling which triggered double file input clicks)
                this.browseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.fileInput.click();
                });
                
                // Upload area click
                this.uploadArea.addEventListener('click', () => this.fileInput.click());
                
                // Drag and drop events
                this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
                this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
                
                // Clear button top
                if (this.clearBtnTop) {
                    this.clearBtnTop.addEventListener('click', () => this.clearFile());
                }

                // Upload Other button
                if (this.uploadOtherBtn) {
                    this.uploadOtherBtn.addEventListener('click', () => {
                        this.clearFile();
                        this.fileInput.click();
                    });
                }
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
                    this.clearFileSelection();
                    return;
                }
                
                // Validate file size
                if (file.size > this.maxFileSize) {
                    this.showAlert('File size too large. Maximum size is 10MB.', 'danger');
                    this.clearFileSelection();
                    return;
                }
                
                // Read and process file
                this.readFile(file);
            }

            clearFileSelection() {
                this.fileInput.value = '';
            }
            
            readFile(file) {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        const htmlContent = this.parseMarkdown(content);
                        this.displayPreview(htmlContent);
                        
                        // Shrink upload section and show preview
                        this.uploadSection.classList.add('d-none');
                        this.previewSection.classList.remove('d-none');
                        this.previewSection.classList.add('fade-in');
                        window.scrollTo(0, 0); // Scroll to top for better reading experience
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
                
                html = html.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;');
                
                html = html.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
                html = html.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
                html = html.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
                html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
                html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
                html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
                
                html = html.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');
                
                html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
                
                html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
                
                html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
                html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                html = html.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
                html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
                html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
                
                html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
                
                html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
                
                html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
                
                html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((<li>.*<\/li>\s*)+)/g, function(match) {
                    if (match.includes('<ul>')) return match;
                    return '<ol>' + match + '</ol>';
                });
                
                html = html.replace(/\n\s*\n/g, '</p><p>');
                html = '<p>' + html + '</p>';
                
                html = html.replace(/<p>\s*<\/p>/g, '');
                html = html.replace(/<p>\s*(<h[1-6]>)/g, '$1');
                html = html.replace(/(<\/h[1-6]>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<hr>)/g, '$1');
                html = html.replace(/(<hr>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<ul>|<ol>|<blockquote>)/g, '$1');
                html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>)\s*<\/p>/g, '$1');
                html = html.replace(/<p>\s*(<pre>)/g, '$1');
                html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');
                
                html = html.replace(/\n/g, '<br>');
                
                return html;
            }
            
            displayPreview(htmlContent) {
                this.previewArea.innerHTML = `<div class="markdown-content">${htmlContent}</div>`;
            }
            
            clearFile() {
                this.clearFileSelection();
                this.previewArea.innerHTML = '';
                
                // Switch sections back
                this.previewSection.classList.add('d-none');
                this.uploadSection.classList.remove('d-none');
                this.uploadSection.classList.add('fade-in');
                
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
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            new MarkdownViewer();
        });