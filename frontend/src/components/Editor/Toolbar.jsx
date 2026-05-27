import React, { useState, useEffect } from 'react'
import './Toolbar.css'

const Toolbar = ({ onFormat, onSave, onUndo, onRedo, onClearFormatting }) => {
  const [fontFamily, setFontFamily] = useState('Book Antiqua')
  const [fontSize, setFontSize] = useState('20')
  const [lineSpacing, setLineSpacing] = useState('1.5')
  const [showTextColorPicker, setShowTextColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [textColor, setTextColor] = useState('#1d1a21')
  const [highlightColor, setHighlightColor] = useState('#ffffff')
  const [recentTextColors, setRecentTextColors] = useState(['#1d1a21', '#674bb5', '#dc2626', '#16a34a'])
  const [recentHighlightColors, setRecentHighlightColors] = useState(['#ffffff', '#fef3c7', '#fce7f3', '#e0e7ff'])
  const [activeFormats, setActiveFormats] = useState({})

  const fontFamilies = [
    'Book Antiqua', 'Arial', 'Times New Roman', 'Calibri',
    'Georgia', 'Verdana', 'Courier New', 'Tahoma', 'Helvetica', 'Segoe UI'
  ]

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 72]
  const lineSpacings = ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0']
  const headings = [
    { command: 'formatBlock', value: 'h1', label: 'H1', title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', label: 'H2', title: 'Heading 2' },
    { command: 'formatBlock', value: 'h3', label: 'H3', title: 'Heading 3' },
    { command: 'formatBlock', value: 'p', label: 'P', title: 'Normal Text' },
  ]

  const colorPresets = [
    '#1d1a21', '#374151', '#6b7280', '#9ca3af',
    '#dc2626', '#ea580c', '#d97706', '#ca8a04',
    '#16a34a', '#059669', '#0891b2', '#0284c7',
    '#4f46e5', '#7c3aed', '#9333ea', '#c026d3',
    '#e11d48', '#674bb5', '#ffffff', '#f3f4f6',
  ]

  const highlightPresets = [
    '#ffffff', '#fef9c3', '#fef3c7', '#fde68a',
    '#dcfce7', '#d1fae5', '#dbeafe', '#e0e7ff',
    '#fce7f3', '#fae8ff', '#ffedd5', '#fee2e2',
  ]

  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        subscript: document.queryCommandState('subscript'),
        superscript: document.queryCommandState('superscript'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      })
    }

    const handleClickOutside = (e) => {
      if (!e.target.closest('.color-picker-wrapper')) {
        setShowTextColorPicker(false)
        setShowHighlightPicker(false)
      }
    }

    document.addEventListener('selectionchange', updateFormats)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('selectionchange', updateFormats)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handleCommand = (command, value = null) => {
    if (onFormat) onFormat(command, value)
  }

  const applyTextColor = (color) => {
    setTextColor(color)
    setRecentTextColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 6))
    handleCommand('foreColor', color)
    setShowTextColorPicker(false)
  }

  const applyHighlight = (color) => {
    setHighlightColor(color)
    setRecentHighlightColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 6))
    handleCommand('hiliteColor', color)
    setShowHighlightPicker(false)
  }

  const applyFontFamily = (font) => {
    setFontFamily(font)
    handleCommand('fontName', font)
  }

  const applyFontSize = (size) => {
    setFontSize(size)
    handleCommand('fontSize', size)
  }

  const applyLineSpacing = (spacing) => {
    setLineSpacing(spacing)
    handleCommand('lineSpacing', spacing)
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imgHtml = `<img src="${event.target.result}" alt="Uploaded image" class="editor-image" style="max-width: 100%; border-radius: 8px; margin: 10px 0; cursor: pointer;" contenteditable="false" />`
          handleCommand('insertHTML', imgHtml)
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please upload a valid image file')
      }
    }
    input.click()
  }

  const handleInsertLink = () => {
    const url = prompt('Enter URL:', 'https://')
    if (url) handleCommand('createLink', url)
  }

  const handleInsertTable = () => {
    const rows = prompt('Enter number of rows:', '3')
    const cols = prompt('Enter number of columns:', '3')
    if (rows && cols) {
      let tableHtml = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
      for (let i = 0; i < parseInt(rows); i++) {
        tableHtml += '<tr>'
        for (let j = 0; j < parseInt(cols); j++) {
          tableHtml += i === 0
            ? '<th style="border: 1px solid #ccc; padding: 8px; background:#f8f8f8; text-align: left;">Header</th>'
            : '<td style="border: 1px solid #ccc; padding: 8px;">Cell</td>'
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</table>'
      handleCommand('insertHTML', tableHtml)
    }
  }

  const handleInsertHorizontalLine = () => {
    handleCommand('insertHTML', '<hr style="margin: 20px 0; border: none; height: 1px; background: linear-gradient(90deg, transparent, #cac4d4, transparent);" />')
  }

  const handleInsertDocument = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const event = new CustomEvent('documentUpload', { detail: file })
        window.dispatchEvent(event)
        alert(`Document "${file.name}" attached successfully!`)
      }
    }
    input.click()
  }

  const isActive = (fmt) => !!activeFormats[fmt]

  return (
    <div className="toolbar-container">

      {/* ── Row 1 ─────────────────────────────────────────────── */}
      <div className="toolbar-row">

        {/* Quick Access */}
        <div className="toolbar-quick-access">
          <button className="toolbar-btn quick-btn" onClick={onSave} title="Save (Ctrl+S)" type="button">
            <span className="material-symbols-outlined">save</span>
          </button>
          <button className="toolbar-btn quick-btn" onClick={onUndo} title="Undo (Ctrl+Z)" type="button">
            <span className="material-symbols-outlined">undo</span>
          </button>
          <button className="toolbar-btn quick-btn" onClick={onRedo} title="Redo (Ctrl+Y)" type="button">
            <span className="material-symbols-outlined">redo</span>
          </button>
          <button className="toolbar-btn quick-btn" onClick={onClearFormatting} title="Clear Formatting" type="button">
            <span className="material-symbols-outlined">format_clear</span>
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Font Family + Size */}
        <div className="toolbar-group">
          <select
            className="toolbar-select toolbar-select-font"
            value={fontFamily}
            onChange={(e) => applyFontFamily(e.target.value)}
            title="Font Family"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>
          <select
            className="toolbar-select toolbar-select-size"
            value={fontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Font Size"
          >
            {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>

        <div className="toolbar-sep" />

        {/* Text Formatting */}
        <div className="toolbar-group">
          <button className={`toolbar-btn fmt-btn ${isActive('bold') ? 'active' : ''}`} onClick={() => handleCommand('bold')} title="Bold (Ctrl+B)" type="button">
            <span className="material-symbols-outlined">format_bold</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('italic') ? 'active' : ''}`} onClick={() => handleCommand('italic')} title="Italic (Ctrl+I)" type="button">
            <span className="material-symbols-outlined">format_italic</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('underline') ? 'active' : ''}`} onClick={() => handleCommand('underline')} title="Underline (Ctrl+U)" type="button">
            <span className="material-symbols-outlined">format_underlined</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('strikeThrough') ? 'active' : ''}`} onClick={() => handleCommand('strikeThrough')} title="Strikethrough" type="button">
            <span className="material-symbols-outlined">format_strikethrough</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('subscript') ? 'active' : ''}`} onClick={() => handleCommand('subscript')} title="Subscript" type="button">
            <span className="material-symbols-outlined">subscript</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('superscript') ? 'active' : ''}`} onClick={() => handleCommand('superscript')} title="Superscript" type="button">
            <span className="material-symbols-outlined">superscript</span>
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Color Pickers */}
        <div className="toolbar-group">
          <div className="color-picker-wrapper">
            <button
              className="toolbar-btn color-btn"
              onClick={() => { setShowTextColorPicker(v => !v); setShowHighlightPicker(false) }}
              title="Text Color"
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_color_text</span>
              <span className="color-bar" style={{ backgroundColor: textColor }} />
            </button>
            {showTextColorPicker && (
              <div className="color-dropdown">
                {recentTextColors.length > 0 && (
                  <>
                    <span className="color-section-label">Recent</span>
                    <div className="color-grid">{recentTextColors.map(c => (
                      <button key={c} className={`color-swatch ${c === textColor ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => applyTextColor(c)} type="button" />
                    ))}</div>
                  </>
                )}
                <span className="color-section-label">Standard</span>
                <div className="color-grid">{colorPresets.map(c => (
                  <button key={c} className={`color-swatch ${c === textColor ? 'selected' : ''}`} style={{ backgroundColor: c }} onClick={() => applyTextColor(c)} type="button" />
                ))}</div>
                <div className="custom-color-row">
                  <input type="color" value={textColor} onChange={(e) => applyTextColor(e.target.value)} className="color-input" />
                  <span>Custom color</span>
                </div>
              </div>
            )}
          </div>

          <div className="color-picker-wrapper">
            <button
              className="toolbar-btn color-btn"
              onClick={() => { setShowHighlightPicker(v => !v); setShowTextColorPicker(false) }}
              title="Highlight Color"
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>format_color_fill</span>
              <span className="color-bar" style={{ backgroundColor: highlightColor, border: highlightColor === '#ffffff' ? '1px solid #ccc' : 'none' }} />
            </button>
            {showHighlightPicker && (
              <div className="color-dropdown">
                {recentHighlightColors.length > 0 && (
                  <>
                    <span className="color-section-label">Recent</span>
                    <div className="color-grid">{recentHighlightColors.map(c => (
                      <button key={c} className={`color-swatch ${c === highlightColor ? 'selected' : ''}`} style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }} onClick={() => applyHighlight(c)} type="button" />
                    ))}</div>
                  </>
                )}
                <span className="color-section-label">Highlights</span>
                <div className="color-grid">{highlightPresets.map(c => (
                  <button key={c} className={`color-swatch ${c === highlightColor ? 'selected' : ''}`} style={{ backgroundColor: c, border: c === '#ffffff' ? '1px solid #ccc' : 'none' }} onClick={() => applyHighlight(c)} type="button" />
                ))}</div>
                <div className="custom-color-row">
                  <input type="color" value={highlightColor} onChange={(e) => applyHighlight(e.target.value)} className="color-input" />
                  <span>Custom color</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2 ─────────────────────────────────────────────── */}
      <div className="toolbar-row">

        {/* Alignment */}
        <div className="toolbar-group">
          <button className={`toolbar-btn fmt-btn ${isActive('justifyLeft') ? 'active' : ''}`} onClick={() => handleCommand('justifyLeft')} title="Align Left" type="button">
            <span className="material-symbols-outlined">format_align_left</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('justifyCenter') ? 'active' : ''}`} onClick={() => handleCommand('justifyCenter')} title="Align Center" type="button">
            <span className="material-symbols-outlined">format_align_center</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('justifyRight') ? 'active' : ''}`} onClick={() => handleCommand('justifyRight')} title="Align Right" type="button">
            <span className="material-symbols-outlined">format_align_right</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('justifyFull') ? 'active' : ''}`} onClick={() => handleCommand('justifyFull')} title="Justify" type="button">
            <span className="material-symbols-outlined">format_align_justify</span>
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Line Spacing + Indent */}
        <div className="toolbar-group">
          <div className="line-spacing-wrapper">
            <span className="material-symbols-outlined line-spacing-icon" style={{ fontSize: 16, color: '#7a7583' }}>format_line_spacing</span>
            <select
              className="toolbar-select toolbar-select-spacing"
              value={lineSpacing}
              onChange={(e) => applyLineSpacing(e.target.value)}
              title="Line Spacing"
            >
              {lineSpacings.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="toolbar-btn fmt-btn" onClick={() => handleCommand('outdent')} title="Decrease Indent" type="button">
            <span className="material-symbols-outlined">format_indent_decrease</span>
          </button>
          <button className="toolbar-btn fmt-btn" onClick={() => handleCommand('indent')} title="Increase Indent" type="button">
            <span className="material-symbols-outlined">format_indent_increase</span>
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Lists + Blocks */}
        <div className="toolbar-group">
          <button className={`toolbar-btn fmt-btn ${isActive('insertUnorderedList') ? 'active' : ''}`} onClick={() => handleCommand('insertUnorderedList')} title="Bullet List" type="button">
            <span className="material-symbols-outlined">format_list_bulleted</span>
          </button>
          <button className={`toolbar-btn fmt-btn ${isActive('insertOrderedList') ? 'active' : ''}`} onClick={() => handleCommand('insertOrderedList')} title="Numbered List" type="button">
            <span className="material-symbols-outlined">format_list_numbered</span>
          </button>
          <button className="toolbar-btn fmt-btn" onClick={() => handleCommand('formatBlock', 'blockquote')} title="Blockquote" type="button">
            <span className="material-symbols-outlined">format_quote</span>
          </button>
          <button className="toolbar-btn fmt-btn" onClick={() => handleCommand('formatBlock', 'pre')} title="Code Block" type="button">
            <span className="material-symbols-outlined">code</span>
          </button>
        </div>

        <div className="toolbar-sep" />

        {/* Headings */}
        <div className="toolbar-group">
          {headings.map(h => (
            <button
              key={h.value}
              className="toolbar-btn heading-btn"
              onClick={() => handleCommand(h.command, h.value)}
              title={h.title}
              type="button"
            >
              {h.label}
            </button>
          ))}
        </div>

        <div className="toolbar-sep" />

        {/* Insert */}
        <div className="toolbar-group">
          <button className="toolbar-btn insert-btn" onClick={handleImageUpload} title="Insert Image" type="button">
            <span className="material-symbols-outlined">image</span>
            <span className="insert-label">Image</span>
          </button>
          <button className="toolbar-btn insert-btn" onClick={handleInsertDocument} title="Insert Document" type="button">
            <span className="material-symbols-outlined">attach_file</span>
            <span className="insert-label">Document</span>
          </button>
          <button className="toolbar-btn insert-btn" onClick={handleInsertLink} title="Insert Link" type="button">
            <span className="material-symbols-outlined">link</span>
            <span className="insert-label">Link</span>
          </button>
          <button className="toolbar-btn insert-btn" onClick={handleInsertTable} title="Insert Table" type="button">
            <span className="material-symbols-outlined">table_rows</span>
            <span className="insert-label">Table</span>
          </button>
          <button className="toolbar-btn insert-btn" onClick={handleInsertHorizontalLine} title="Horizontal Line" type="button">
            <span className="material-symbols-outlined">horizontal_rule</span>
            <span className="insert-label">Line</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default Toolbar