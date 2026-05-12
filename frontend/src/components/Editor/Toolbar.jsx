import React from 'react'
import './Toolbar.css'

const Toolbar = ({ onFormat }) => {
  const tools = [
    { command: 'bold', icon: 'format_bold', title: 'Bold' },
    { command: 'italic', icon: 'format_italic', title: 'Italic' },
    { command: 'underline', icon: 'format_underlined', title: 'Underline' },
    { divider: true },
    { command: 'formatBlock', value: 'h1', icon: 'format_h1', title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', icon: 'format_h2', title: 'Heading 2' },
    { divider: true },
    { command: 'insertUnorderedList', icon: 'format_list_bulleted', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: 'format_list_numbered', title: 'Numbered List' },
    { divider: true },
    { command: 'createLink', icon: 'link', title: 'Insert Link' },
    { command: 'insertImage', icon: 'image', title: 'Insert Image' },
    { command: 'insertHTML', icon: 'code', title: 'Code Block' },
    { divider: true },
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
      }
    } else if (tool.value) {
      onFormat(tool.command, tool.value)
    } else {
      onFormat(tool.command)
    }
  }

  return (
    <div className="toolbar">
      {tools.map((tool, index) => {
        if (tool.divider) {
          return <div key={`divider-${index}`} className="toolbar-divider" />
        }
        return (
          <button
            key={tool.command}
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
      <button className="toolbar-btn" title="More options">
        <span className="material-symbols-outlined">more_vert</span>
      </button>
    </div>
  )
}

export default Toolbar