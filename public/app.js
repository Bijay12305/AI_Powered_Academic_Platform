/**
 * StudentHub – AI-Powered Academic & Project Management Platform
 * Client-side State Management, Router, AI Notes Generator & Dynamic UI Engine
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    student: null,
    subjects: [],
    notes: [],
    studyMaterials: [],
    assignments: [],
    projects: [],
    todayTasks: [],
    calendarEvents: [],
    notifications: [],
    settings: {
      theme: 'light',
      aiModelPreference: 'balanced',
      autoSaveNotes: true
    },
    activeView: 'ai-notes',
    aiStudio: {
      currentStep: 2,
      activeTab: 'shortNotes',
      isEditing: false,
      uploadedFile: {
        name: 'Operating_Systems_Unit3.pdf',
        size: '2.4 MB',
        type: 'PDF'
      },
      currentGeneratedNote: null
    },
    calendarDate: new Date()
  };

  // --- Utility Helpers ---
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdown(mdText) {
    if (!mdText) return '<p>No content available.</p>';
    let html = escapeHtml(mdText);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Tables
    if (html.includes('|')) {
      const lines = html.split('\n');
      let inTable = false;
      let tableHtml = '<table>';
      const outputLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('|') && line.endsWith('|')) {
          if (line.includes('---')) continue; // Skip markdown separator
          const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (!inTable) {
            inTable = true;
            tableHtml += '<thead><tr>' + cells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
          } else {
            tableHtml += '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
          }
        } else {
          if (inTable) {
            inTable = false;
            tableHtml += '</tbody></table>';
            outputLines.push(tableHtml);
            tableHtml = '<table>';
          }
          outputLines.push(line);
        }
      }
      if (inTable) {
        tableHtml += '</tbody></table>';
        outputLines.push(tableHtml);
      }
      html = outputLines.join('\n');
    }

    // Bullet Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^• (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.*$)/gim, '<li><strong>$1.</strong> $2</li>');
    html = html.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');

    // Paragraphs & Line Breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');

    return html;
  }

  // --- Toast Notification System ---
  function showToast(message, type = 'info', duration = 3500) {
    const container = $('#toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Modal Manager ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  function initModals() {
    $$('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    $$('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      });
    });
  }

  // --- Router & View Navigation ---
  function switchView(viewName) {
    state.activeView = viewName;

    // Update active sidebar nav items
    $$('.sidebar .nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update active mobile bottom nav items
    $$('.bottom-nav-bar .bottom-nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update page views
    $$('.page-view').forEach(view => {
      if (view.id === `view-${viewName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Close mobile drawer and overlay if open
    $('#sidebar')?.classList.remove('open');
    $('#sidebar-overlay')?.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Always re-render the target view freshly
    if (viewName === 'dashboard') {
      renderDashboard();
    } else if (viewName === 'subjects') {
      renderSubjects();
    } else if (viewName === 'notes') {
      renderNotesLibrary();
    } else if (viewName === 'study-material') {
      renderStudyMaterials();
    } else if (viewName === 'assignments') {
      renderAssignments();
    } else if (viewName === 'projects') {
      renderProjects();
    } else if (viewName === 'calendar') {
      renderCalendarMonth();
    } else if (viewName === 'deadlines') {
      renderDeadlinesView();
    } else if (viewName === 'profile') {
      renderProfile();
    } else if (viewName === 'ai-notes') {
      renderCurrentNoteTab();
    }
  }

  function initNavigation() {
    $$('.sidebar .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view) {
          location.hash = view;
          switchView(view);
        }
      });
    });

    // Mobile Bottom Nav items
    $$('.bottom-nav-bar .bottom-nav-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view) {
          location.hash = view;
          switchView(view);
        }
      });
    });

    // Mobile Bottom Nav "Menu" Button
    $('#bnav-menu-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const sidebar = $('#sidebar');
      const overlay = $('#sidebar-overlay');
      if (sidebar) sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    // Top CTA quick AI button
    $('#top-quick-ai-btn')?.addEventListener('click', () => {
      location.hash = 'ai-notes';
      switchView('ai-notes');
    });

    $('#brand-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = 'ai-notes';
      switchView('ai-notes');
    });

    // Mobile Hamburger
    $('#mobile-menu-toggle')?.addEventListener('click', () => {
      const sidebar = $('#sidebar');
      const overlay = $('#sidebar-overlay');
      if (sidebar) sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    // Click outside sidebar on overlay to close
    $('#sidebar-overlay')?.addEventListener('click', () => {
      $('#sidebar')?.classList.remove('open');
      $('#sidebar-overlay')?.classList.remove('active');
    });

    // Global action links (e.g. data-action="go-notes")
    document.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');

      if (action === 'go-ai-notes') {
        location.hash = 'ai-notes';
        switchView('ai-notes');
      } else if (action === 'go-subjects') {
        location.hash = 'subjects';
        switchView('subjects');
      } else if (action === 'go-notes') {
        location.hash = 'notes';
        switchView('notes');
      } else if (action === 'go-assignments') {
        location.hash = 'assignments';
        switchView('assignments');
      } else if (action === 'go-projects') {
        location.hash = 'projects';
        switchView('projects');
      } else if (action === 'go-deadlines') {
        location.hash = 'deadlines';
        switchView('deadlines');
      } else if (action === 'go-profile') {
        location.hash = 'profile';
        switchView('profile');
        $('#profile-dropdown-menu').classList.remove('active');
      } else if (action === 'go-settings') {
        location.hash = 'settings';
        switchView('settings');
        $('#profile-dropdown-menu').classList.remove('active');
      } else if (action === 'toggle-theme') {
        toggleTheme();
        $('#profile-dropdown-menu').classList.remove('active');
      } else if (action === 'logout') {
        showToast('Logged out of demo account. Reloading session...', 'info');
        setTimeout(() => location.reload(), 1200);
      }
    });

    // Handle initial hash or fallback
    const initialHash = location.hash.replace('#', '');
    if (initialHash && document.getElementById(`view-${initialHash}`)) {
      switchView(initialHash);
    } else {
      switchView('ai-notes');
    }

    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace('#', '');
      if (hash && document.getElementById(`view-${hash}`)) {
        switchView(hash);
      }
    });
  }

  // --- Flyouts & Dropdowns ---
  function initFlyouts() {
    const notifBtn = $('#notif-bell-btn');
    const notifFlyout = $('#notif-flyout');
    const profileBtn = $('#profile-pill-btn');
    const profileMenu = $('#profile-dropdown-menu');

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.remove('active');
      notifFlyout.classList.toggle('active');
    });

    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifFlyout.classList.remove('active');
      profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      notifFlyout.classList.remove('active');
      profileMenu.classList.remove('active');
    });

    $('#mark-all-read-btn').addEventListener('click', () => {
      state.notifications.forEach(n => n.unread = false);
      $('#notif-badge').style.display = 'none';
      renderNotifications();
      showToast('All notifications marked as read', 'success');
    });
  }

  // --- Theme Management ---
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    state.settings.theme = next;
    $('#theme-toggle-label').textContent = next === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    showToast(`Switched to ${next} theme`, 'info');
  }

  function initTheme() {
    $('#theme-btn-light')?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'light');
      state.settings.theme = 'light';
      showToast('Light theme enabled', 'info');
    });
    $('#theme-btn-dark')?.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      state.settings.theme = 'dark';
      showToast('Dark theme enabled', 'info');
    });
  }

  // --- AI Generated Notes Studio Logic (Specs #5 - #14) ---
  function initAiNotesStudio() {
    const dropzone = $('#ai-dropzone');
    const fileInput = $('#file-upload-input');
    const activeFilePill = $('#active-file-pill');
    const btnRemoveFile = $('#btn-remove-file');
    const textPasteArea = $('#ai-text-paste');
    const subjectSelect = $('#ai-subject-select');
    const unitSelect = $('#ai-unit-select');
    const btnGenerate = $('#btn-generate-notes');
    const btnRegenerate = $('#btn-regenerate-notes');
    const previewTabs = $('#note-preview-tabs');
    const renderedView = $('#rendered-note-view');
    const inlineEditorContainer = $('#inline-editor-container');
    const noteEditTextarea = $('#note-edit-textarea');
    const btnToggleEdit = $('#btn-toggle-edit');
    const editBtnLabel = $('#edit-btn-label');
    const btnDownload = $('#btn-download-note');
    const btnSaveNote = $('#btn-save-to-notes');
    const loadingOverlay = $('#ai-loading-overlay');
    const loadingStatusText = $('#ai-loading-status-text');
    const loadingSubText = $('#ai-loading-sub-text');
    const progressFill = $('#ai-progress-fill');

    // Stepper Indicators
    function updateStepper(step) {
      state.aiStudio.currentStep = step;
      for (let i = 1; i <= 4; i++) {
        const stepEl = $(`#step-${i}-indicator`);
        const lineEl = $(`#step-line-${i}`);
        if (!stepEl) continue;

        if (i < step) {
          stepEl.className = 'stepper-step completed';
          if (lineEl) lineEl.className = 'stepper-line active';
        } else if (i === step) {
          stepEl.className = 'stepper-step active';
          if (lineEl) lineEl.className = 'stepper-line';
        } else {
          stepEl.className = 'stepper-step';
          if (lineEl) lineEl.className = 'stepper-line';
        }
      }
    }

    // Dropzone Interactions
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileUpload(e.target.files[0]);
      }
    });

    function handleFileUpload(file) {
      state.aiStudio.uploadedFile = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split('.').pop().toUpperCase()
      };
      $('#uploaded-file-name').textContent = state.aiStudio.uploadedFile.name;
      $('#uploaded-file-size').textContent = `${state.aiStudio.uploadedFile.size} • Ready for AI extraction`;
      activeFilePill.style.display = 'flex';
      updateStepper(2);
      showToast(`Uploaded ${file.name}`, 'success');
    }

    btnRemoveFile.addEventListener('click', () => {
      state.aiStudio.uploadedFile = null;
      activeFilePill.style.display = 'none';
      fileInput.value = '';
      showToast('File removed', 'info');
    });

    // Checkbox toggles style
    $$('.checkbox-card input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          cb.closest('.checkbox-card').classList.add('checked');
        } else {
          cb.closest('.checkbox-card').classList.remove('checked');
        }
      });
    });

    // Preview Tab Switching (Spec #10)
    previewTabs.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.tab-btn');
      if (!tabBtn) return;
      const tabKey = tabBtn.getAttribute('data-tab');
      if (!tabKey) return;

      $$('.preview-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
      tabBtn.classList.add('active');
      state.aiStudio.activeTab = tabKey;
      renderCurrentNoteTab();
    });

    function renderCurrentNoteTab() {
      const note = state.aiStudio.currentGeneratedNote;
      if (!note || !note.content) return;

      $('#preview-note-title').textContent = note.title;
      $('#preview-note-subject').textContent = note.subject;

      const tabKey = state.aiStudio.activeTab || 'shortNotes';
      const rawText = note.content[tabKey] || note.content.shortNotes || 'No content available.';

      renderedView.innerHTML = renderMarkdown(rawText);
      noteEditTextarea.value = rawText;
    }

    // Toggle In-place Editor (Spec #11 & #13)
    btnToggleEdit.addEventListener('click', () => {
      state.aiStudio.isEditing = !state.aiStudio.isEditing;
      if (state.aiStudio.isEditing) {
        renderedView.style.display = 'none';
        inlineEditorContainer.classList.add('active');
        editBtnLabel.textContent = '✓ Done Editing';
        noteEditTextarea.focus();
      } else {
        // Save edited content back to state object
        const tabKey = state.aiStudio.activeTab || 'shortNotes';
        if (state.aiStudio.currentGeneratedNote) {
          state.aiStudio.currentGeneratedNote.content[tabKey] = noteEditTextarea.value;
        }
        renderedView.style.display = 'block';
        inlineEditorContainer.classList.remove('active');
        editBtnLabel.textContent = '✎ Edit Notes';
        renderCurrentNoteTab();
        showToast('Changes saved to preview', 'info');
      }
    });

    // Editor Toolbar Commands
    $$('.editor-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        const start = noteEditTextarea.selectionStart;
        const end = noteEditTextarea.selectionEnd;
        const selected = noteEditTextarea.value.substring(start, end);
        let replacement = selected;

        if (cmd === 'bold') replacement = `**${selected || 'bold text'}**`;
        else if (cmd === 'italic') replacement = `*${selected || 'italic text'}*`;
        else if (cmd === 'heading') replacement = `\n### ${selected || 'Section Heading'}\n`;
        else if (cmd === 'bullet') replacement = `\n* ${selected || 'List item'}\n`;
        else if (cmd === 'code') replacement = `\`${selected || 'code / formula'}\``;

        noteEditTextarea.setRangeText(replacement, start, end, 'end');
      });
    });

    // Generate Notes Action (Specs #8, #13, #30)
    async function triggerAiGeneration() {
      const subject = subjectSelect.value;
      const unit = unitSelect.value;
      const text = textPasteArea.value;
      const selectedNoteTypes = Array.from($$('input[name="notetype"]:checked')).map(cb => cb.value);

      // Loading Animation Pipeline
      updateStepper(3);
      loadingOverlay.classList.add('active');
      btnGenerate.classList.add('loading');
      progressFill.style.width = '20%';
      loadingStatusText.textContent = 'Analyzing material...';
      loadingSubText.textContent = `Reading ${state.aiStudio.uploadedFile ? state.aiStudio.uploadedFile.name : 'pasted text'} and parsing syllabus topics`;

      await new Promise(r => setTimeout(r, 650));
      progressFill.style.width = '55%';
      loadingStatusText.textContent = 'Creating structured notes...';
      loadingSubText.textContent = `Extracting key points, definitions, MCQs & viva questions for ${subject} (${unit})`;

      await new Promise(r => setTimeout(r, 600));
      progressFill.style.width = '85%';
      loadingStatusText.textContent = 'Finalizing preview format...';
      loadingSubText.textContent = 'Formatting Markdown tables, formulas, and test cards';

      try {
        const res = await fetch('/api/notes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            unit,
            noteTypes: selectedNoteTypes,
            materialText: text,
            fileName: state.aiStudio.uploadedFile ? state.aiStudio.uploadedFile.name : 'Notes.txt'
          })
        });
        const data = await res.json();
        if (data.success && data.note) {
          state.aiStudio.currentGeneratedNote = data.note;
          progressFill.style.width = '100%';
          await new Promise(r => setTimeout(r, 300));
          loadingOverlay.classList.remove('active');
          btnGenerate.classList.remove('loading');
          updateStepper(4);
          renderCurrentNoteTab();
          showToast(`✨ Generated ${data.note.title} successfully!`, 'success');
        }
      } catch (err) {
        console.error('Error generating notes:', err);
        loadingOverlay.classList.remove('active');
        btnGenerate.classList.remove('loading');
        showToast('Failed to generate notes. Please check connection.', 'error');
      }
    }

    btnGenerate.addEventListener('click', triggerAiGeneration);
    btnRegenerate.addEventListener('click', triggerAiGeneration);

    // Save to My Notes Action (Spec #12)
    btnSaveNote.addEventListener('click', async () => {
      const note = state.aiStudio.currentGeneratedNote;
      if (!note) return;

      try {
        const res = await fetch('/api/notes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note })
        });
        const data = await res.json();
        if (data.success) {
          state.notes.unshift(data.note);
          renderNotesLibrary();
          renderDashboard();
          $('#badge-notes').textContent = state.notes.length;
          showToast('💾 Saved note to My Notes library!', 'success');
        }
      } catch (err) {
        showToast('Error saving note', 'error');
      }
    });

    // Download Note Action (Spec #12)
    btnDownload.addEventListener('click', () => {
      const note = state.aiStudio.currentGeneratedNote;
      if (!note) return;
      const fullText = `# ${note.title}\nSubject: ${note.subject} | ${note.unit}\nDate: ${note.date}\n\n` +
        `## 1. Short Notes\n${note.content.shortNotes || ''}\n\n` +
        `## 2. Key Points\n${note.content.keyPoints || ''}\n\n` +
        `## 3. Important Topics\n${note.content.importantTopics || ''}\n\n` +
        `## 4. MCQs\n${note.content.mcqs || ''}\n\n` +
        `## 5. Viva Questions\n${note.content.vivaQuestions || ''}\n\n` +
        `## 6. Summary\n${note.content.summary || ''}`;

      const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Downloaded note as Markdown file', 'success');
    });

    // OCR Modal Trigger
    $('#btn-trigger-ocr').addEventListener('click', () => openModal('modal-scan-notes'));
    $('#dash-scan-notes-btn').addEventListener('click', () => openModal('modal-scan-notes'));
    $('#btn-process-ocr').addEventListener('click', async () => {
      closeModal('modal-scan-notes');
      showToast('Processing handwritten image with OCR...', 'info');
      try {
        const res = await fetch('/api/scan-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'handwritten_os_scan.jpg' })
        });
        const data = await res.json();
        if (data.success) {
          textPasteArea.value = data.extractedText;
          showToast('✓ OCR Text Extracted & Cleaned! Ready to generate notes.', 'success');
          switchView('ai-notes');
        }
      } catch (err) {
        showToast('OCR failed', 'error');
      }
    });

    // Lecture Audio Modal Trigger
    $('#btn-trigger-lecture').addEventListener('click', () => openModal('modal-lecture-notes'));
    $('#dash-lecture-notes-btn').addEventListener('click', () => openModal('modal-lecture-notes'));
    $('#btn-process-lecture').addEventListener('click', async () => {
      closeModal('modal-lecture-notes');
      showToast('Transcribing lecture audio recording...', 'info');
      try {
        const res = await fetch('/api/lecture-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: 'OS_Lecture_Unit3.mp3' })
        });
        const data = await res.json();
        if (data.success) {
          textPasteArea.value = data.transcript;
          showToast('✓ Lecture Transcribed! Ready to generate notes.', 'success');
          switchView('ai-notes');
        }
      } catch (err) {
        showToast('Transcription failed', 'error');
      }
    });

    // "How it Works" guide trigger
    $('#btn-how-it-works').addEventListener('click', () => openModal('modal-how-it-works'));
  }

  // --- Dashboard Renderer (Spec #15) ---
  function renderDashboard() {
    $('#stat-subjects-count').textContent = state.subjects.length;
    $('#stat-notes-count').textContent = state.notes.length;
    $('#stat-assignments-count').textContent = state.assignments.filter(a => a.status !== 'Completed').length;
    $('#stat-projects-count').textContent = state.projects.length;
    $('#stat-deadlines-count').textContent = state.assignments.filter(a => a.status !== 'Completed').length + 1;

    // Badges in nav
    $('#badge-subjects').textContent = state.subjects.length;
    $('#badge-notes').textContent = state.notes.length;
    $('#badge-materials').textContent = state.studyMaterials.length;
    $('#badge-assignments').textContent = state.assignments.filter(a => a.status !== 'Completed').length;
    $('#badge-projects').textContent = state.projects.length;
    $('#badge-deadlines').textContent = state.assignments.filter(a => a.status !== 'Completed').length + 1;

    // Recent Notes Grid
    const recentNotesContainer = $('#dash-recent-notes-container');
    if (recentNotesContainer) {
      recentNotesContainer.innerHTML = state.notes.slice(0, 4).map(note => `
        <div class="note-summary-card" data-note-id="${note.id}">
          <div class="note-card-top">
            <span class="note-tag-pill">${escapeHtml(note.subject)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(note.unit || '')}</span>
          </div>
          <h4>${escapeHtml(note.title)}</h4>
          <div class="note-card-snippet">${escapeHtml((note.content && note.content.shortNotes) ? note.content.shortNotes.slice(0, 100) + '...' : 'Quick revision study note')}</div>
          <div class="note-card-footer">
            <span>📅 ${note.date}</span>
            <span style="color:var(--primary-blue);font-weight:700;">Open →</span>
          </div>
        </div>
      `).join('');

      recentNotesContainer.querySelectorAll('.note-summary-card').forEach(card => {
        card.addEventListener('click', () => {
          const noteId = card.getAttribute('data-note-id');
          const note = state.notes.find(n => n.id === noteId);
          if (note) {
            state.aiStudio.currentGeneratedNote = note;
            switchView('ai-notes');
            $('#preview-note-title').textContent = note.title;
            $('#preview-note-subject').textContent = note.subject;
            $('#rendered-note-view').innerHTML = renderMarkdown(note.content ? note.content.shortNotes : '');
          }
        });
      });
    }

    // Projects summary on dashboard
    const dashProjContainer = $('#dash-projects-container');
    if (dashProjContainer) {
      dashProjContainer.innerHTML = state.projects.map(proj => `
        <div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="font-size:0.92rem;color:var(--text-primary);">${escapeHtml(proj.name)}</strong>
            <span class="status-badge in-progress">${escapeHtml(proj.currentStage)}</span>
          </div>
          <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">Guide: ${escapeHtml(proj.guide)} • Due: ${proj.deadline}</p>
          <div class="progress-track">
            <div class="progress-fill" style="width:${proj.progress}%;"></div>
          </div>
        </div>
      `).join('');
    }

    // Today Tasks Checklist
    renderTodayTasks();

    // Upcoming Deadlines List
    const deadlinesContainer = $('#dash-deadlines-container');
    if (deadlinesContainer) {
      deadlinesContainer.innerHTML = state.assignments.slice(0, 4).map(asg => {
        const isCompleted = asg.status === 'Completed';
        return `
          <div class="deadline-item">
            <div class="deadline-left">
              <div class="deadline-indicator ${asg.priority === 'High' ? 'high' : 'medium'}"></div>
              <div class="deadline-info">
                <h4>${escapeHtml(asg.title)}</h4>
                <p>${escapeHtml(asg.subject)} • Due ${asg.dueDate}</p>
              </div>
            </div>
            <span class="deadline-badge ${isCompleted ? 'soon' : 'urgent'}">${isCompleted ? 'Submitted' : 'Pending'}</span>
          </div>
        `;
      }).join('');
    }
  }

  // --- Today Tasks Checklist Logic ---
  function renderTodayTasks() {
    const container = $('#today-tasks-container');
    if (!container) return;

    container.innerHTML = state.todayTasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          <span class="task-title">${escapeHtml(task.title)}</span>
        </div>
        <span class="task-subject-tag">${escapeHtml(task.subject || 'Academic')}</span>
      </div>
    `).join('');

    container.querySelectorAll('.task-item').forEach(item => {
      const checkbox = item.querySelector('.task-checkbox');
      checkbox.addEventListener('change', async () => {
        const taskId = item.getAttribute('data-task-id');
        const task = state.todayTasks.find(t => t.id === taskId);
        if (task) {
          task.completed = checkbox.checked;
          if (task.completed) item.classList.add('completed');
          else item.classList.remove('completed');

          try {
            await fetch('/api/today-tasks/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: taskId })
            });
            showToast(task.completed ? 'Task completed!' : 'Task active', 'info');
          } catch (e) {}
        }
      });
    });
  }

  function renderSubjects() {
    const container = $('#subjects-cards-container');
    if (!container) return;

    const subjectIcons = {
      'Operating Systems': '💻',
      'DBMS': '🗄️',
      'Computer Networks': '🌐',
      'Java Programming': '☕',
      'Mathematics & Discrete Structures': '📐'
    };

    container.innerHTML = state.subjects.map(subj => {
      const icon = subjectIcons[subj.name] || '📚';
      return `
        <div class="subject-card" data-subject-id="${subj.id}">
          <div class="subject-card-header">
            <div class="subject-icon-box" style="background:${subj.color};">
              ${icon}
            </div>
            <span class="subject-code-tag">${escapeHtml(subj.code)}</span>
          </div>

          <div class="subject-card-body">
            <h3>${escapeHtml(subj.name)}</h3>
            <p class="subject-faculty">Faculty: ${escapeHtml(subj.faculty)} (${subj.credits} Credits)</p>

            <div class="subject-stats-row">
              <span style="color:#60a5fa;font-weight:700;">📝 ${subj.notesCount} Notes</span>
              <span style="color:#fbbf24;font-weight:700;">📋 ${subj.assignmentsCount} Assignments</span>
            </div>

            <!-- Units List Preview -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">
              ${(subj.units || []).slice(0, 3).map(u => `
                <span style="font-size:0.7rem;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.06);color:var(--text-secondary);border:1px solid var(--border-light);">
                  U${u.id}: ${escapeHtml(u.name.slice(0, 18))}...
                </span>
              `).join('')}
            </div>

            <div class="subject-progress-wrap">
              <div class="progress-label-row">
                <span>Syllabus Covered</span>
                <span style="color:#ffffff;font-weight:800;">${subj.progress}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${subj.progress}%;background:${subj.color};"></div>
              </div>
            </div>
          </div>

          <div class="subject-card-footer">
            <span style="color:#ffffff;font-weight:700;">View Syllabus & Notes →</span>
            <span class="btn-generate-from-doc" style="padding:4px 10px;font-size:0.72rem;">✨ AI Notes</span>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const subId = card.getAttribute('data-subject-id');
        const subj = state.subjects.find(s => s.id === subId);
        if (subj) {
          // Preselect subject in AI Studio
          $('#ai-subject-select').value = subj.name;
          location.hash = 'ai-notes';
          switchView('ai-notes');
          showToast(`Selected ${subj.name} for AI generation`, 'info');
        }
      });
    });
  }

  // --- Notes Library Renderer (Spec #17) ---
  function renderNotesLibrary() {
    const container = $('#notes-library-container');
    if (!container) return;

    const searchTerm = ($('#notes-search-box')?.value || '').toLowerCase();
    const filterSubj = $('#notes-filter-subject')?.value || 'All';
    const filterUnit = $('#notes-filter-unit')?.value || 'All';

    let filtered = state.notes.filter(note => {
      const matchSearch = note.title.toLowerCase().includes(searchTerm) ||
        note.subject.toLowerCase().includes(searchTerm) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(searchTerm)));
      const matchSubj = filterSubj === 'All' || note.subject === filterSubj;
      const matchUnit = filterUnit === 'All' || note.unit === filterUnit;
      return matchSearch && matchSubj && matchUnit;
    });

    // Pinned notes first
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No notes found matching your filters.</div>`;
      return;
    }

    container.innerHTML = filtered.map(note => `
      <div class="note-card ${note.pinned ? 'pinned' : ''}" data-note-id="${note.id}">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <span class="note-tag-pill" style="background:var(--primary-blue-subtle);color:var(--primary-blue);">${escapeHtml(note.subject)}</span>
            <div class="note-card-actions">
              <button class="note-action-btn pin ${note.pinned ? 'active' : ''}" data-action="pin-note" title="Pin Note">📌</button>
              <button class="note-action-btn delete" data-action="delete-note" title="Delete Note">🗑️</button>
            </div>
          </div>
          <h3 style="font-size:1.05rem;font-weight:800;color:var(--text-primary);line-height:1.3;">${escapeHtml(note.title)}</h3>
          <p style="font-size:0.75rem;color:var(--text-muted);margin:4px 0 10px 0;">${escapeHtml(note.unit || '')} • ${note.date}</p>
          <div class="note-card-snippet">${escapeHtml((note.content && note.content.shortNotes) ? note.content.shortNotes.slice(0, 130) + '...' : '')}</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--border-subtle);">
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${(note.tags || []).slice(0, 2).map(t => `<span style="font-size:0.68rem;padding:2px 6px;border-radius:4px;background:var(--bg-surface-secondary);color:var(--text-muted);">${escapeHtml(t)}</span>`).join('')}
          </div>
          <button class="btn-secondary" style="padding:4px 10px;font-size:0.75rem;" data-action="view-note">Open Note</button>
        </div>
      </div>
    `).join('');

    // Action handlers on cards
    container.querySelectorAll('.note-card').forEach(card => {
      const noteId = card.getAttribute('data-note-id');
      const note = state.notes.find(n => n.id === noteId);

      card.querySelector('[data-action="pin-note"]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (note) {
          note.pinned = !note.pinned;
          renderNotesLibrary();
          await fetch(`/api/notes/${noteId}/pin`, { method: 'PUT' });
          showToast(note.pinned ? 'Note pinned' : 'Note unpinned', 'info');
        }
      });

      card.querySelector('[data-action="delete-note"]')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${note.title}"?`)) {
          state.notes = state.notes.filter(n => n.id !== noteId);
          renderNotesLibrary();
          renderDashboard();
          await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
          showToast('Note deleted', 'info');
        }
      });

      card.querySelector('[data-action="view-note"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (note) {
          state.aiStudio.currentGeneratedNote = note;
          switchView('ai-notes');
          $('#preview-note-title').textContent = note.title;
          $('#preview-note-subject').textContent = note.subject;
          $('#rendered-note-view').innerHTML = renderMarkdown(note.content ? note.content.shortNotes : '');
        }
      });
    });
  }

  function initNotesFilter() {
    $('#notes-search-box')?.addEventListener('input', renderNotesLibrary);
    $('#notes-filter-subject')?.addEventListener('change', renderNotesLibrary);
    $('#notes-filter-unit')?.addEventListener('change', renderNotesLibrary);
  }

  // --- Study Material Vault Renderer (Spec #18) ---
  function renderStudyMaterials() {
    const tbody = $('#study-material-tbody');
    if (!tbody) return;

    tbody.innerHTML = state.studyMaterials.map(mat => `
      <tr data-mat-id="${mat.id}">
        <td>
          <div class="material-title-cell">
            <div class="file-type-icon" style="${mat.type === 'PPT' ? 'background:#fef3c7;color:#d97706;' : ''}">${escapeHtml(mat.type)}</div>
            <div>
              <strong>${escapeHtml(mat.name)}</strong>
              <div style="font-size:0.74rem;color:var(--text-muted);">${escapeHtml(mat.summary || '')}</div>
            </div>
          </div>
        </td>
        <td><span class="note-tag-pill">${escapeHtml(mat.subject)}</span></td>
        <td><strong>${escapeHtml(mat.type)}</strong></td>
        <td>${escapeHtml(mat.size)}</td>
        <td>${mat.uploadedDate}</td>
        <td>
          <div style="display:flex;gap:8px;">
            <button class="btn-generate-from-doc" data-action="generate-from-doc" title="Convert to Notes with AI">
              <span>⚡ Generate Notes</span>
            </button>
            <button class="note-action-btn" data-action="delete-material" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('tr').forEach(row => {
      const matId = row.getAttribute('data-mat-id');
      const mat = state.studyMaterials.find(m => m.id === matId);

      row.querySelector('[data-action="generate-from-doc"]')?.addEventListener('click', () => {
        if (mat) {
          $('#ai-subject-select').value = mat.subject;
          state.aiStudio.uploadedFile = { name: mat.name, size: mat.size, type: mat.type };
          $('#uploaded-file-name').textContent = mat.name;
          $('#uploaded-file-size').textContent = `${mat.size} • Selected from Vault`;
          $('#active-file-pill').style.display = 'flex';
          switchView('ai-notes');
          showToast(`Loaded ${mat.name} into AI Studio. Ready to generate!`, 'success');
        }
      });

      row.querySelector('[data-action="delete-material"]')?.addEventListener('click', async () => {
        if (confirm(`Remove "${mat.name}"?`)) {
          state.studyMaterials = state.studyMaterials.filter(m => m.id !== matId);
          renderStudyMaterials();
          $('#badge-materials').textContent = state.studyMaterials.length;
          await fetch(`/api/study-materials/${matId}`, { method: 'DELETE' });
          showToast('Material removed', 'info');
        }
      });
    });
  }

  // --- Ask AI Academic Doubts Chatbot (Spec #14) ---
  function initAskAiChat() {
    const chatContainer = $('#chat-messages-container');
    const input = $('#chat-user-input');
    const sendBtn = $('#btn-send-chat');

    async function sendQuestion(text) {
      if (!text || !text.trim()) return;
      const question = text.trim();
      input.value = '';

      // Append User message
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-msg user';
      userMsg.innerHTML = `
        <div class="chat-avatar student">BM</div>
        <div class="chat-bubble">${escapeHtml(question)}</div>
      `;
      chatContainer.appendChild(userMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Temporary typing indicator
      const typingMsg = document.createElement('div');
      typingMsg.className = 'chat-msg ai';
      typingMsg.innerHTML = `
        <div class="chat-avatar ai">✨</div>
        <div class="chat-bubble" style="font-style:italic;color:var(--text-muted);">Synthesizing explanation & exam points...</div>
      `;
      chatContainer.appendChild(typingMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      try {
        const res = await fetch('/api/ask-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, subject: 'Computer Science & Engineering' })
        });
        const data = await res.json();
        typingMsg.remove();

        if (data.success && data.response) {
          const r = data.response;
          const aiMsg = document.createElement('div');
          aiMsg.className = 'chat-msg ai';
          aiMsg.innerHTML = `
            <div class="chat-avatar ai">✨</div>
            <div class="chat-bubble">
              <strong style="color:var(--ai-purple);font-size:0.95rem;">💡 Explanation:</strong>
              <p style="margin:6px 0 10px 0;">${escapeHtml(r.explanation)}</p>

              <strong style="color:var(--text-primary);">📌 Key Points:</strong>
              <ul style="margin:6px 0 10px 18px;">
                ${(r.keyPoints || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
              </ul>

              <div style="background:var(--bg-surface);padding:10px 14px;border-radius:8px;border-left:3px solid var(--primary-blue);margin:8px 0;font-size:0.84rem;">
                <strong>Real World Example:</strong> ${escapeHtml(r.example)}
              </div>

              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;">
                <strong>Quick Revision Summary:</strong> ${escapeHtml(r.summary)}
              </div>
            </div>
          `;
          chatContainer.appendChild(aiMsg);
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      } catch (err) {
        typingMsg.remove();
        showToast('Error asking AI', 'error');
      }
    }

    sendBtn.addEventListener('click', () => sendQuestion(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendQuestion(input.value);
    });

    // Prompt Chips
    $$('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = chip.getAttribute('data-prompt');
        if (p) sendQuestion(p);
      });
    });
  }

  // --- Assignments Page Renderer (Spec #19) ---
  function renderAssignments(filter = 'All') {
    const container = $('#assignments-container');
    if (!container) return;

    let list = state.assignments;
    if (filter !== 'All') {
      list = list.filter(a => a.status === filter);
    }

    const subjectColors = {
      'Operating Systems': '#3b82f6',
      'DBMS': '#8b5cf6',
      'Computer Networks': '#10b981',
      'Java Programming': '#f59e0b',
      'Mathematics & Discrete Structures': '#ec4899'
    };

    if (list.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:var(--bg-surface-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:10px;">📋</div>
        <strong style="font-size:1.1rem;color:#fff;">No ${filter} assignments found</strong>
        <p style="font-size:0.85rem;margin-top:6px;">You are all caught up on your college submissions!</p>
      </div>`;
      return;
    }

    container.innerHTML = list.map(asg => {
      const isCompleted = asg.status === 'Completed';
      const isOverdue = !isCompleted && new Date(asg.dueDate) < new Date('2026-09-06');
      const subjColor = subjectColors[asg.subject] || '#3b82f6';

      return `
        <div class="assignment-card ${isOverdue ? 'overdue' : ''}" data-asg-id="${asg.id}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
              <span class="note-tag-pill" style="background:${subjColor}20;color:${subjColor};border:1px solid ${subjColor}40;">
                📚 ${escapeHtml(asg.subject)}
              </span>
              <span class="status-badge ${asg.status.toLowerCase().replace(' ', '-')}">
                ${isCompleted ? '✓ Completed' : (asg.status === 'In Progress' ? '⚡ In Progress' : '⏳ Not Started')}
              </span>
            </div>

            <h3 style="font-size:1.1rem;font-weight:800;color:#ffffff;line-height:1.35;margin-bottom:8px;">${escapeHtml(asg.title)}</h3>
            <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.55;margin-bottom:14px;">${escapeHtml(asg.description)}</p>
          </div>

          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-subtle);">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">
              <span style="display:flex;align-items:center;gap:6px;">
                <span>📅</span>
                <strong style="color:${isOverdue ? 'var(--danger-red)' : '#ffffff'};">Due: ${asg.dueDate}</strong>
              </span>
              <span style="font-weight:700;padding:2px 8px;border-radius:4px;background:${asg.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'};color:${asg.priority === 'High' ? '#f87171' : '#fbbf24'};">
                ${asg.priority} Priority
              </span>
            </div>

            <div style="display:flex;gap:10px;">
              <button class="btn-primary" style="flex:1;padding:8px 12px;font-size:0.8rem;background:${isCompleted ? 'var(--bg-surface-elevated)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};border-color:${isCompleted ? 'var(--border-light)' : 'rgba(16,185,129,0.4)'};box-shadow:${isCompleted ? 'none' : '0 4px 14px rgba(16,185,129,0.35)'};" data-action="toggle-asg-status">
                ${isCompleted ? '↩ Reopen' : '✓ Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.assignment-card').forEach(card => {
      const asgId = card.getAttribute('data-asg-id');
      const asg = state.assignments.find(a => a.id === asgId);

      card.querySelector('[data-action="toggle-asg-status"]')?.addEventListener('click', async () => {
        if (asg) {
          asg.status = asg.status === 'Completed' ? 'In Progress' : 'Completed';
          renderAssignments(filter);
          renderDashboard();
          await fetch(`/api/assignments/${asgId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: asg.status })
          });
          showToast(`Assignment updated to ${asg.status}!`, 'success');
        }
      });
    });
  }

  function initAssignmentsFilter() {
    $$('#assignment-status-tabs .btn-secondary').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#assignment-status-tabs .btn-secondary').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderAssignments(filter);
      });
    });
  }

  // --- Projects & Kanban Renderer (Specs #20 - #21) ---
  function renderProjects() {
    const proj = state.projects[0]; // Primary showcase project
    if (!proj) return;

    const heroContainer = $('#project-hero-details');
    if (heroContainer) {
      heroContainer.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:20px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span class="note-tag-pill" style="background:rgba(16, 185, 129, 0.2);color:#34d399;border:1px solid rgba(16, 185, 129, 0.4);">
                🚀 ${escapeHtml(proj.category)}
              </span>
              <span class="status-badge in-progress" style="font-size:0.72rem;">
                Stage: ${escapeHtml(proj.currentStage)}
              </span>
            </div>
            <h2 style="font-size:1.6rem;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">${escapeHtml(proj.name)}</h2>
            <p style="font-size:0.88rem;color:var(--text-secondary);max-width:740px;line-height:1.6;margin-top:8px;">${escapeHtml(proj.description)}</p>
            
            <div style="display:flex;gap:20px;margin-top:12px;font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap;">
              <span>👨‍🏫 Project Guide: <strong style="color:#ffffff;">${escapeHtml(proj.guide)}</strong></span>
              <span>📅 Final Presentation: <strong style="color:#60a5fa;">${proj.deadline}</strong></span>
            </div>
          </div>

          <div style="background:var(--bg-surface-elevated);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:18px 24px;text-align:center;min-width:160px;box-shadow:var(--shadow-sm);">
            <div style="font-size:2rem;font-weight:800;background:var(--ai-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${proj.progress}%</div>
            <div style="font-size:0.76rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-top:2px;">Milestone Progress</div>
          </div>
        </div>

        <!-- 8-Stage Development Stepper (Spec #20) -->
        <div class="stage-stepper">
          ${(proj.stages || []).map((st, idx) => `
            <div class="stage-item ${st.status.toLowerCase().replace(' ', '-')}" style="padding:6px 12px;border-radius:20px;background:${st.status === 'Completed' ? 'rgba(16,185,129,0.15)' : (st.status === 'In Progress' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)')};border:1px solid ${st.status === 'Completed' ? 'rgba(16,185,129,0.3)' : (st.status === 'In Progress' ? 'rgba(59,130,246,0.4)' : 'transparent')};">
              <span>${st.status === 'Completed' ? '✓' : idx + 1}.</span>
              <span style="font-weight:700;">${escapeHtml(st.name)}</span>
            </div>
            ${idx < proj.stages.length - 1 ? '<span style="color:rgba(255,255,255,0.2);font-weight:700;">→</span>' : ''}
          `).join('')}
        </div>

        <!-- Team Collaboration Row (Spec #21) -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding-top:18px;border-top:1px solid var(--border-subtle);flex-wrap:wrap;gap:14px;">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span style="font-size:0.84rem;font-weight:800;color:#ffffff;">👥 Project Team:</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${(proj.team || []).map(m => `
                <div style="display:flex;align-items:center;gap:8px;background:var(--bg-surface-elevated);border:1px solid var(--border-light);padding:5px 12px;border-radius:20px;font-size:0.78rem;">
                  <img src="${m.avatar}" style="width:22px;height:22px;border-radius:50%;border:1px solid #60a5fa;">
                  <strong style="color:#ffffff;">${escapeHtml(m.name)}</strong>
                  <span style="color:var(--text-muted);font-size:0.72rem;">(${escapeHtml(m.role)})</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="font-size:0.78rem;color:var(--text-muted);background:rgba(255,255,255,0.03);padding:6px 12px;border-radius:8px;">
            ⚡ Activity: <em style="color:#cbd5e1;">${proj.activities && proj.activities[0] ? proj.activities[0].user + ' ' + proj.activities[0].action : 'Working on milestone'}</em>
          </div>
        </div>
      `;
    }

    // Render Kanban Tasks
    renderKanbanTasks(proj);
  }

  function renderKanbanTasks(proj) {
    const todoContainer = $('#kanban-items-todo');
    const inprogressContainer = $('#kanban-items-inprogress');
    const completedContainer = $('#kanban-items-completed');
    if (!todoContainer || !inprogressContainer || !completedContainer) return;

    const tasks = proj.tasks || [];
    const todoList = tasks.filter(t => t.status === 'To Do');
    const inprogList = tasks.filter(t => t.status === 'In Progress');
    const compList = tasks.filter(t => t.status === 'Completed');

    $('#badge-kanban-todo').textContent = todoList.length;
    $('#badge-kanban-inprogress').textContent = inprogList.length;
    $('#badge-kanban-completed').textContent = compList.length;

    function renderCards(list, nextStatus, nextLabel) {
      if (list.length === 0) {
        return `<div style="text-align:center;padding:30px 10px;color:var(--text-muted);font-size:0.8rem;border:1px dashed var(--border-light);border-radius:var(--radius-md);">
          No tasks in this stage
        </div>`;
      }

      return list.map(t => `
        <div class="kanban-card" data-task-id="${t.id}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:4px;background:${t.priority === 'High' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'};color:${t.priority === 'High' ? '#f87171' : '#60a5fa'};border:1px solid ${t.priority === 'High' ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'};">
              ${t.priority} Priority
            </span>
            <span style="font-size:0.72rem;color:var(--text-muted);">📅 ${t.deadline || '2026-09-20'}</span>
          </div>

          <h4 style="font-size:0.92rem;font-weight:800;color:#ffffff;line-height:1.4;margin-bottom:12px;">${escapeHtml(t.title)}</h4>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border-subtle);">
            <span style="font-size:0.75rem;color:#cbd5e1;display:flex;align-items:center;gap:6px;">
              <span style="width:20px;height:20px;border-radius:50%;background:var(--primary-blue);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;">
                ${t.assignedTo.split(' ').map(n=>n[0]).join('')}
              </span>
              <strong>${escapeHtml(t.assignedTo)}</strong>
            </span>

            ${nextStatus ? `<button class="btn-primary" style="padding:4px 10px;font-size:0.72rem;border-radius:6px;" data-move-to="${nextStatus}">${nextLabel}</button>` : '<span style="font-size:0.75rem;color:#34d399;font-weight:800;">✓ Completed</span>'}
          </div>
        </div>
      `).join('');
    }

    todoContainer.innerHTML = renderCards(todoList, 'In Progress', 'Start →');
    inprogressContainer.innerHTML = renderCards(inprogList, 'Completed', 'Done ✓');
    completedContainer.innerHTML = renderCards(compList, null, '');

    // Move task click handler
    $$('.kanban-card [data-move-to]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const card = btn.closest('.kanban-card');
        const taskId = card.getAttribute('data-task-id');
        const targetStatus = btn.getAttribute('data-move-to');
        const task = proj.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = targetStatus;
          renderKanbanTasks(proj);
          await fetch(`/api/projects/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus })
          });
          showToast(`Task moved to ${targetStatus}`, 'success');
        }
      });
    });
  }

  // --- Calendar Renderer (Spec #22) ---
  function renderCalendarMonth() {
    const container = $('#calendar-grid-container');
    if (!container) return;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = daysOfWeek.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // Render September 2026 grid (Sept 1 is Tuesday)
    const totalDays = 30;
    const startDayIndex = 2; // Tuesday

    for (let i = 0; i < startDayIndex; i++) {
      html += `<div class="cal-day-cell" style="opacity:0.35;"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
      const isToday = day === 6; // Demo day
      const events = state.calendarEvents.filter(e => e.date === dateStr);

      html += `
        <div class="cal-day-cell ${isToday ? 'today' : ''}">
          <div style="display:flex;justify-content:space-between;">
            <span>${day}</span>
            ${isToday ? '<span style="font-size:0.65rem;color:var(--primary-blue);font-weight:800;">TODAY</span>' : ''}
          </div>
          ${events.map(ev => `
            <div class="cal-event-pill" style="background:${ev.color || 'var(--primary-blue)'};" title="${escapeHtml(ev.title)} (${ev.time})">
              ${escapeHtml(ev.title)}
            </div>
          `).join('')}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // --- Deadlines Page Renderer (Spec #23) ---
  function renderDeadlinesView() {
    const container = $('#deadlines-grouped-container');
    if (!container) return;

    const todayItems = [
      { title: 'OS CPU Scheduling Unit 3 Revision', type: 'Self Study', due: 'Today, 8:00 PM', urgency: 'high' }
    ];

    const thisWeekItems = state.assignments.filter(a => a.status !== 'Completed');

    const laterItems = [
      { title: 'Smart Campus Management System Mid-Review', type: 'Project', due: '2026-09-18', urgency: 'medium' },
      { title: 'Mid-Semester Examination (All 5 Subjects)', type: 'Exam', due: '2026-09-22', urgency: 'high' }
    ];

    container.innerHTML = `
      <div class="deadlines-group">
        <div class="deadlines-group-title">🔥 Due Today</div>
        <div class="workspace-card" style="padding:14px 20px;">
          ${todayItems.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);">${item.type}</div>
              </div>
              <span class="deadline-badge urgent">${item.due}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="deadlines-group">
        <div class="deadlines-group-title">📅 Due This Week</div>
        <div class="workspace-card" style="padding:14px 20px;">
          ${thisWeekItems.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(item.subject)} • Due: ${item.dueDate}</div>
              </div>
              <span class="deadline-badge ${item.priority === 'High' ? 'urgent' : 'soon'}">${item.priority} Priority</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="deadlines-group">
        <div class="deadlines-group-title">📌 Upcoming Later</div>
        <div class="workspace-card" style="padding:14px 20px;">
          ${laterItems.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);">${item.type}</div>
              </div>
              <span class="deadline-badge soon">Due: ${item.due}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- Profile & Badges Renderer (Spec #24) ---
  function renderProfile() {
    const student = state.student;
    if (!student) return;

    const badgesContainer = $('#profile-badges-container');
    if (badgesContainer && student.badges) {
      badgesContainer.innerHTML = student.badges.map(b => `
        <div class="badge-card" title="${escapeHtml(b.desc)}">
          <div class="badge-icon">${b.icon}</div>
          <div class="badge-name">${escapeHtml(b.name)}</div>
        </div>
      `).join('');
    }

    // Profile Edit Form Submit
    $('#profile-edit-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = {
        name: $('#prof-name').value,
        email: $('#prof-email').value,
        course: $('#prof-course').value,
        year: $('#prof-year').value,
        college: $('#prof-college').value,
        bio: $('#prof-bio').value
      };
      state.student = { ...state.student, ...updated };
      $('.profile-name').textContent = updated.name;
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      showToast('Profile updated successfully', 'success');
    });
  }

  // --- Notifications Renderer ---
  function renderNotifications() {
    const container = $('#notif-list-container');
    if (!container) return;

    container.innerHTML = state.notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        ${n.unread ? '<div class="notif-dot"></div>' : ''}
        <div>
          <div class="notif-title">${escapeHtml(n.title)}</div>
          <div class="notif-desc">${escapeHtml(n.message)}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  }

  // --- Global Search System ---
  function initGlobalSearch() {
    const input = $('#global-search-input');
    if (!input) return;

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        input.focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        // Route to matching section
        if (query.includes('note') || query.includes('schedul') || query.includes('os') || query.includes('dbms')) {
          $('#notes-search-box').value = query;
          switchView('notes');
          renderNotesLibrary();
        } else if (query.includes('assign')) {
          switchView('assignments');
        } else if (query.includes('project') || query.includes('campus')) {
          switchView('projects');
        } else {
          $('#notes-search-box').value = query;
          switchView('notes');
          renderNotesLibrary();
        }
      }
    });
  }

  // --- Initial Data Loader & App Bootstrapper ---
  async function loadInitialData() {
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      state.student = data.student || {};
      state.subjects = data.subjects || [];
      state.notes = data.notes || [];
      state.studyMaterials = data.studyMaterials || [];
      state.assignments = data.assignments || [];
      state.projects = data.projects || [];
      state.todayTasks = data.todayTasks || [];
      state.calendarEvents = data.calendarEvents || [];
      state.notifications = data.notifications || [];
      state.settings = data.settings || state.settings;

      // Set initial generated note in AI studio to note-1 (Unit 3: Process Scheduling)
      const initialNote = state.notes.find(n => n.id === 'note-1') || state.notes[0];
      if (initialNote) {
        state.aiStudio.currentGeneratedNote = JSON.parse(JSON.stringify(initialNote));
      }

      // Initial Renders
      renderDashboard();
      renderSubjects();
      renderNotesLibrary();
      renderStudyMaterials();
      renderAssignments();
      renderProjects();
      renderProfile();
      renderNotifications();

      // Render AI Notes Studio
      if (state.aiStudio.currentGeneratedNote) {
        $('#preview-note-title').textContent = state.aiStudio.currentGeneratedNote.title;
        $('#preview-note-subject').textContent = state.aiStudio.currentGeneratedNote.subject;
        $('#rendered-note-view').innerHTML = renderMarkdown(state.aiStudio.currentGeneratedNote.content.shortNotes);
      }

    } catch (err) {
      console.error('Failed to load initial data:', err);
      showToast('Loaded local fallback data', 'info');
    }
  }

  // --- Modal Form Handlers ---
  function initFormHandlers() {
    // Manual Note Form
    $('#btn-create-manual-note')?.addEventListener('click', () => openModal('modal-note-editor'));
    $('#dash-create-note-btn')?.addEventListener('click', () => openModal('modal-note-editor'));
    $('#btn-save-manual-note')?.addEventListener('click', async () => {
      const title = $('#manual-note-title-input').value;
      const subject = $('#manual-note-subject-select').value;
      const unit = $('#manual-note-unit-input').value;
      const content = $('#manual-note-content-input').value;

      if (!title || !content) {
        showToast('Please fill title and content', 'error');
        return;
      }

      const newNote = {
        title,
        subject,
        unit: unit || 'Unit Notes',
        date: new Date().toISOString().split('T')[0],
        pinned: false,
        isAiGenerated: false,
        tags: [subject.replace(' ', ''), 'ManualNote'],
        content: {
          shortNotes: content,
          keyPoints: content,
          importantTopics: content,
          mcqs: 'No MCQs generated for manual note.',
          vivaQuestions: 'No viva questions available.',
          summary: content.slice(0, 150) + '...'
        }
      };

      try {
        const res = await fetch('/api/notes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: newNote })
        });
        const data = await res.json();
        if (data.success) {
          state.notes.unshift(data.note);
          renderNotesLibrary();
          renderDashboard();
          closeModal('modal-note-editor');
          showToast('Note created successfully!', 'success');
        }
      } catch (err) {
        showToast('Failed to create note', 'error');
      }
    });

    // Add Assignment Form
    $('#btn-add-assignment')?.addEventListener('click', () => openModal('modal-add-assignment'));
    $('#dash-add-asg-btn')?.addEventListener('click', () => openModal('modal-add-assignment'));
    $('#btn-submit-assignment')?.addEventListener('click', async () => {
      const title = $('#asg-title-input').value;
      const subject = $('#asg-subject-select').value;
      const dueDate = $('#asg-duedate-input').value;
      const priority = $('#asg-priority-select').value;
      const description = $('#asg-desc-input').value;

      if (!title || !dueDate) {
        showToast('Please fill assignment title and due date', 'error');
        return;
      }

      const newAsg = {
        title,
        subject,
        dueDate,
        priority,
        status: 'Not Started',
        progress: 0,
        description: description || 'No instructions provided.'
      };

      try {
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAsg)
        });
        const data = await res.json();
        if (data.success) {
          state.assignments.unshift(data.assignment);
          renderAssignments();
          renderDashboard();
          closeModal('modal-add-assignment');
          showToast('Assignment added successfully!', 'success');
        }
      } catch (e) {
        showToast('Failed to add assignment', 'error');
      }
    });

    // Upload Study Material Form
    $('#btn-upload-new-material')?.addEventListener('click', () => openModal('modal-upload-material'));
    $('#dash-upload-mat-btn')?.addEventListener('click', () => openModal('modal-upload-material'));
    $('#btn-submit-upload-mat')?.addEventListener('click', async () => {
      const name = $('#mat-name-input').value;
      const subject = $('#mat-subject-select').value;
      const type = $('#mat-type-select').value;
      const summary = $('#mat-summary-input').value;

      if (!name) {
        showToast('Please specify document name', 'error');
        return;
      }

      const newMat = {
        name: name.includes('.') ? name : `${name}.${type.toLowerCase()}`,
        subject,
        type,
        size: '3.2 MB',
        uploadedDate: new Date().toISOString().split('T')[0],
        pages: 35,
        summary: summary || 'Uploaded study document.'
      };

      try {
        const res = await fetch('/api/study-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMat)
        });
        const data = await res.json();
        if (data.success) {
          state.studyMaterials.unshift(data.material);
          renderStudyMaterials();
          closeModal('modal-upload-material');
          showToast('Document stored in Vault!', 'success');
        }
      } catch (e) {
        showToast('Upload failed', 'error');
      }
    });

    // Add Project Task Form
    $('#btn-add-project-task')?.addEventListener('click', () => openModal('modal-add-task'));
    $('#btn-submit-task')?.addEventListener('click', async () => {
      const title = $('#task-title-input').value;
      const assignedTo = $('#task-assignee-select').value;
      const priority = $('#task-priority-select').value;
      const deadline = $('#task-deadline-input').value;

      if (!title) {
        showToast('Please enter task title', 'error');
        return;
      }

      const newTask = {
        title,
        assignedTo,
        priority,
        status: 'To Do',
        deadline: deadline || '2026-09-20'
      };

      try {
        const res = await fetch('/api/projects/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: 'proj-1', task: newTask })
        });
        const data = await res.json();
        if (data.success) {
          state.projects[0].tasks.push(data.task);
          renderProjects();
          closeModal('modal-add-task');
          showToast('Task added to Kanban Board!', 'success');
        }
      } catch (e) {
        showToast('Failed to add task', 'error');
      }
    });
  }

  // ==========================================================================
  // SUPABASE CLOUD DATABASE INTEGRATION
  // ==========================================================================
  function initSupabaseIntegration() {
    const topBadge = $('#topbar-db-badge');
    const topDot = $('#topbar-db-dot');
    const topText = $('#topbar-db-text');

    const statusDot = $('#supabase-status-dot');
    const statusLabel = $('#supabase-status-label');
    const diagStatus = $('#diag-status-text');
    const diagLatency = $('#diag-latency-text');
    const diagMode = $('#diag-mode-text');

    const urlInput = $('#supabase-url-input');
    const keyInput = $('#supabase-key-input');
    const toggleKeyBtn = $('#toggle-supabase-key-visibility');

    const btnSave = $('#btn-save-supabase-config');
    const btnSync = $('#btn-sync-to-supabase');
    const btnPull = $('#btn-pull-from-supabase');
    const btnViewSql = $('#btn-view-sql-schema');
    const btnCopySql = $('#btn-copy-supabase-sql');

    // Click Topbar Badge to Navigate to Settings
    topBadge?.addEventListener('click', () => {
      switchView('settings');
      setTimeout(() => {
        $('.supabase-config-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Toggle API Key visibility
    toggleKeyBtn?.addEventListener('click', () => {
      if (keyInput) {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
        toggleKeyBtn.textContent = keyInput.type === 'password' ? '👁️' : '🙈';
      }
    });

    // Check Live Status
    async function checkSupabaseStatus() {
      try {
        const res = await fetch('/api/supabase/status');
        const data = await res.json();

        if (data.connected) {
          // Connected to Supabase
          if (topDot) topDot.className = 'db-dot dot-online';
          if (topText) topText.textContent = 'Supabase Cloud';
          if (statusDot) statusDot.className = 'pulse-dot-indicator dot-green';
          if (statusLabel) statusLabel.textContent = '🟢 Connected to PostgreSQL';
          if (diagStatus) diagStatus.textContent = 'Connected (Cloud Active)';
          if (diagLatency) diagLatency.textContent = `${data.latencyMs} ms`;
          if (diagMode) diagMode.textContent = 'Supabase Cloud + Local Backup';
        } else if (data.configured) {
          // Configured but error
          if (topDot) topDot.className = 'db-dot dot-error';
          if (topText) topText.textContent = 'Supabase Error';
          if (statusDot) statusDot.className = 'pulse-dot-indicator dot-red';
          if (statusLabel) statusLabel.textContent = '🔴 Connection Error';
          if (diagStatus) diagStatus.textContent = data.message || 'Connection failed';
          if (diagLatency) diagLatency.textContent = 'Error';
          if (diagMode) diagMode.textContent = 'Fallback to Local JSON';
        } else {
          // Not configured (Local Fallback)
          if (topDot) topDot.className = 'db-dot dot-offline';
          if (topText) topText.textContent = 'Local DB (JSON)';
          if (statusDot) statusDot.className = 'pulse-dot-indicator dot-yellow';
          if (statusLabel) statusLabel.textContent = '🟡 Local Fallback Mode';
          if (diagStatus) diagStatus.textContent = 'Local database.json';
          if (diagLatency) diagLatency.textContent = 'Local (0ms)';
          if (diagMode) diagMode.textContent = 'Local JSON Storage';
        }

        if (data.url && urlInput && !urlInput.value) {
          urlInput.value = data.url;
        }
      } catch (err) {
        if (topDot) topDot.className = 'db-dot dot-offline';
        if (topText) topText.textContent = 'Local DB';
      }
    }

    // Save & Test Credentials
    btnSave?.addEventListener('click', async () => {
      const url = urlInput ? urlInput.value.trim() : '';
      const key = keyInput ? keyInput.value.trim() : '';

      if (!url) {
        showToast('Please enter your Supabase Project URL', 'error');
        return;
      }
      if (!key) {
        showToast('Please enter your Supabase API Key', 'error');
        return;
      }

      btnSave.disabled = true;
      btnSave.innerHTML = `<span>Connecting...</span>`;

      try {
        const res = await fetch('/api/supabase/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, key })
        });
        const result = await res.json();

        if (result.connected) {
          showToast(`⚡ Connected to Supabase PostgreSQL (${result.latencyMs}ms)!`, 'success');
        } else {
          showToast(result.message || 'Saved, but could not connect to Supabase.', 'error');
        }

        await checkSupabaseStatus();
      } catch (err) {
        showToast('Failed to save Supabase configuration', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Test & Connect</span>
        `;
      }
    });

    // Sync Local -> Supabase
    btnSync?.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.innerHTML = `<span>Syncing...</span>`;

      try {
        const res = await fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction: 'push' })
        });
        const data = await res.json();

        if (data.success) {
          showToast('🚀 Successfully pushed all records to Supabase PostgreSQL!', 'success');
          await checkSupabaseStatus();
        } else {
          showToast(data.message || 'Sync failed. Check Supabase connection.', 'error');
        }
      } catch (err) {
        showToast('Sync request failed', 'error');
      } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          <span>Sync Local Data to Supabase</span>
        `;
      }
    });

    // Pull Cloud -> Local
    btnPull?.addEventListener('click', async () => {
      btnPull.disabled = true;
      btnPull.innerHTML = `<span>Pulling...</span>`;

      try {
        const res = await fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction: 'pull' })
        });
        const data = await res.json();

        if (data.success) {
          showToast('📥 Loaded latest database snapshot from Supabase!', 'success');
          await loadInitialData();
        } else {
          showToast(data.message || 'Failed to pull from Supabase Cloud.', 'error');
        }
      } catch (err) {
        showToast('Pull request failed', 'error');
      } finally {
        btnPull.disabled = false;
        btnPull.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          <span>Pull from Cloud</span>
        `;
      }
    });

    // View SQL Schema
    btnViewSql?.addEventListener('click', async () => {
      openModal('modal-supabase-schema');
      const textarea = $('#supabase-sql-code-display');
      if (textarea) {
        textarea.value = '-- Fetching schema.sql...';
        try {
          const res = await fetch('/api/supabase/schema');
          const data = await res.json();
          if (data.success && data.sql) {
            textarea.value = data.sql;
          } else {
            textarea.value = '-- Error loading schema.sql';
          }
        } catch (e) {
          textarea.value = '-- Error connecting to server for schema.sql';
        }
      }
    });

    // Copy SQL Schema
    btnCopySql?.addEventListener('click', () => {
      const textarea = $('#supabase-sql-code-display');
      if (textarea && textarea.value) {
        navigator.clipboard.writeText(textarea.value).then(() => {
          showToast('📋 SQL migration script copied to clipboard!', 'success');
        }).catch(() => {
          textarea.select();
          document.execCommand('copy');
          showToast('📋 SQL migration script copied!', 'success');
        });
      }
    });

    // Initial check
    checkSupabaseStatus();
  }

  // --- Initialize Entire Application ---
  function initApp() {
    initNavigation();
    initFlyouts();
    initTheme();
    initModals();
    initAiNotesStudio();
    initNotesFilter();
    initAskAiChat();
    initAssignmentsFilter();
    initGlobalSearch();
    initFormHandlers();
    initSupabaseIntegration();
    loadInitialData();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
