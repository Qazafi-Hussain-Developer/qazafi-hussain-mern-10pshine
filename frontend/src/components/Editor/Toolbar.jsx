import React from 'react'
import './Toolbar.css'

const Toolbar = ({ onFormat }) => {
  // Define tools with unique keys
  const tools = [
    { command: 'bold', icon: 'format_bold', title: 'Bold', key: 'bold' },
    { command: 'italic', icon: 'format_italic', title: 'Italic', key: 'italic' },
    { command: 'underline', icon: 'format_underlined', title: 'Underline', key: 'underline' },
    { divider: true, key: 'divider1' },
    { command: 'formatBlock', value: 'h1', icon: 'format_h1', title: 'Heading 1', key: 'heading1' },
    { command: 'formatBlock', value: 'h2', icon: 'format_h2', title: 'Heading 2', key: 'heading2' },
    { divider: true, key: 'divider2' },
    { command: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Bullet List', key: 'bulletList' },
    { command: 'insertOrderedList', icon: 'format_list_numbered', title: 'Numbered List', key: 'numberedList' },
    { divider: true, key: 'divider3' },
    { command: 'createLink', icon: 'link', title: 'Insert Link', key: 'insertLink' },
    { command: 'insertImage', icon: 'image', title: 'Insert Image', key: 'insertImage' },
    { command: 'insertHTML', icon: 'code', title: 'Code Block', key: 'codeBlock' },
    { divider: true, key: 'divider4' },
  ]

  const handleClick = (tool) => {
    if (tool.command === 'createLink') {
      const url = prompt('Enter the URL:')
      if (url) onFormat(tool.command, url)
    } else if (tool.command === 'insertImage') {
      const url = prompt('Enter the image URL:')
      if (url) onFormat(tool.command, url)
    } else if (tool.command === 'insertHTML') {
      const code = prompt('Enter your code:')
      if (code) {
        const pre = document.createElement('pre')
        const codeElem = document.createElement('code')
        codeElem.textContent = code
        pre.appendChild(codeElem)
        document.execCommand('insertHTML', false, pre.outerHTML)
        if (onFormat) onFormat('insertHTML', code)
      }
    } else if (tool.value) {
      onFormat(tool.command, tool.value)
    } else {
      onFormat(tool.command)
    }
  }

  return (
    <div className="toolbar">
      {tools.map((tool) => {
        if (tool.divider) {
          return <div key={tool.key} className="toolbar-divider" />
        }
        return (
          <button
            key={tool.key}
            className="toolbar-btn"
            onClick={() => handleClick(tool)}
            title={tool.title}
            type="button"
          >
            <span className="material-symbols-outlined">{tool.icon}</span>
          </button>
        )
      })}
      <div className="toolbar-spacer" />
      <button className="toolbar-btn" title="More options" key="moreOptions">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
    </div>
  )
}

export default Toolbar