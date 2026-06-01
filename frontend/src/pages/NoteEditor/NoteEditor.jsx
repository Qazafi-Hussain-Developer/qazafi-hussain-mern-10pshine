import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import { useAuth } from '../../context/AuthContext'
import './NoteEditor.css'

/* ─── Inline styles for editor-specific CSS ─────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display&display=swap');

  /* ── Toolbar ────────────────────────────────────────────── */
  .ne-toolbar {
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(196,179,232,0.25);
    padding: 5px 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;
    position: sticky;
    top: 58px;
    z-index: 40;
    box-shadow: 0 1px 0 rgba(103,75,181,0.04);
  }

  .ne-tb-group {
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 0 5px;
    position: relative;
  }

  .ne-tb-group::after {
    content: '';
    position: absolute;
    right: 0;
    top: 4px;
    bottom: 4px;
    width: 1px;
    background: #e8e0f4;
  }

  .ne-tb-group:last-child::after { display: none; }

  .ne-tb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    color: #6b5f82;
    transition: background 0.12s, color 0.12s, transform 0.08s;
    flex-shrink: 0;
  }

  .ne-tb-btn .ms {
    font-size: 18px;
    font-variation-settings: 'FILL' 0, 'wght' 350, 'GRAD' 0, 'opsz' 20;
    line-height: 1;
  }

  .ne-tb-btn:hover {
    background: #f0e8fb;
    color: #5a3da0;
  }

  .ne-tb-btn.active {
    background: #ede5f8;
    color: #5a3da0;
    box-shadow: inset 0 0 0 1px rgba(107,71,184,0.2);
  }

  .ne-tb-btn.active .ms {
    font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
  }

  .ne-tb-btn:active { transform: scale(0.92); }

  /* Heading buttons */
  .ne-tb-heading-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    color: #6b5f82;
    font-size: 12px;
    font-weight: 700;
    padding: 0 7px;
    font-family: 'DM Serif Display', serif;
    letter-spacing: 0.02em;
    transition: background 0.12s, color 0.12s;
  }

  .ne-tb-heading-btn:hover {
    background: #f0e8fb;
    color: #5a3da0;
  }

  .ne-tb-heading-btn.active {
    background: #ede5f8;
    color: #5a3da0;
    box-shadow: inset 0 0 0 1px rgba(107,71,184,0.2);
  }

  /* Toolbar selects */
  .ne-tb-select {
    height: 30px;
    padding: 0 22px 0 8px;
    border: 1px solid #e8e0f4;
    border-radius: 7px;
    font-size: 12px;
    color: #3d2f66;
    background: #faf8fd url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a78bfa' stroke-width='1.3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 7px center;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }

  .ne-tb-select:hover { border-color: #c4b3e8; background-color: #f5f0fd; }
  .ne-tb-select:focus { border-color: #a78bfa; box-shadow: 0 0 0 2.5px rgba(167,139,250,0.15); }
  .ne-tb-select-font { width: 136px; }
  .ne-tb-select-size { width: 58px; text-align: center; }

  /* Color picker buttons */
  .ne-color-wrap {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }

  .ne-color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 32px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    padding: 4px 6px;
    transition: background 0.12s;
  }

  .ne-color-btn:hover { background: #f0e8fb; }
  .ne-color-btn .ms { font-size: 16px; color: #6b5f82; }
  .ne-color-bar { width: 18px; height: 3.5px; border-radius: 2px; flex-shrink: 0; }

  /* Color dropdown */
  .ne-color-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border: 1px solid #e8e0f4;
    border-radius: 15px;
    box-shadow: 0 8px 28px rgba(103,75,181,0.15), 0 2px 8px rgba(0,0,0,0.06);
    z-index: 500;
    padding: 12px 14px;
    min-width: 220px;
    animation: colorDropIn 0.15s ease;
  }

  @keyframes colorDropIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.98); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  .ne-color-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #b0a0cc;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 9px;
  }

  .ne-color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    margin-bottom: 6px;
  }

  .ne-swatch {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.12s, box-shadow 0.12s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.09);
  }

  .ne-swatch:hover { transform: scale(1.15); box-shadow: 0 2px 8px rgba(107,71,184,0.22); }
  .ne-swatch.sel {
    border-color: #7c3aed;
    transform: scale(1.08);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.2);
  }

  .ne-custom-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 10px;
    margin-top: 6px;
    border-top: 1px solid #f0ebf8;
    font-size: 12px;
    color: #9b8bbf;
    font-weight: 500;
  }

  .ne-custom-row input[type="color"] {
    width: 36px;
    height: 32px;
    border: 1px solid #ddd6f0;
    border-radius: 8px;
    padding: 2px 3px;
    cursor: pointer;
    background: #fff;
  }

  /* Image wrapper & controls */
  .ne-img-wrapper {
    display: inline-block;
    position: relative;
    line-height: 0;
    border-radius: 10px;
    transition: outline 0.12s;
  }

  .ne-img-wrapper.selected {
    outline: 2.5px solid #7c3aed;
    outline-offset: 3px;
  }

  .ne-img-controls {
    position: absolute;
    top: -38px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 16, 48, 0.92);
    border-radius: 10px;
    padding: 4px 8px;
    display: none;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
    z-index: 20;
    backdrop-filter: blur(4px);
  }

  .ne-img-wrapper.selected .ne-img-controls { display: flex; }

  .ne-img-align-btn {
    background: transparent;
    border: none;
    color: #c4b3e8;
    cursor: pointer;
    padding: 3px 7px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: background 0.1s, color 0.1s;
  }

  .ne-img-align-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .ne-img-align-btn .ms { font-size: 15px; }

  .ne-img-controls-sep { width: 1px; height: 16px; background: rgba(255,255,255,0.2); margin: 0 3px; }
  .ne-img-size-label { font-size: 10.5px; color: #c4b3e8; font-family: monospace; padding: 0 4px; }

  .ne-img-del-btn {
    background: transparent;
    border: none;
    color: #f87171;
    cursor: pointer;
    padding: 3px 7px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: background 0.1s;
  }

  .ne-img-del-btn:hover { background: rgba(220,38,38,0.25); }
  .ne-img-del-btn .ms { font-size: 15px; }

  .ne-resize-handle {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 12px;
    height: 12px;
    background: #7c3aed;
    border: 2px solid #fff;
    border-radius: 50%;
    cursor: se-resize;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  /* Note color chips row */
  .ne-note-colors {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 28px;
    border-top: 1px solid #f5f0fb;
    border-bottom: 1px solid #f5f0fb;
    flex-wrap: wrap;
    direction: ltr;
  }

  .ne-note-colors-label {
    font-size: 10px;
    font-weight: 700;
    color: #c4b3d8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-right: 6px;
  }

  .ne-note-chip {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    transition: transform 0.13s, box-shadow 0.13s;
  }

  .ne-note-chip:hover { transform: scale(1.2); box-shadow: 0 2px 8px rgba(107,71,184,0.25); }
  .ne-note-chip.active {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px #7c3aed;
    transform: scale(1.1);
  }

  /* Title input */
  .ne-title-input {
    width: 100%;
    border: none;
    background: transparent;
    font-family: 'DM Serif Display', 'Georgia', serif;
    font-size: 29px;
    color: #1a1030;
    padding: 16px 28px 10px;
    line-height: 1.25;
    outline: none;
    letter-spacing: -0.02em;
  }

  .ne-title-input::placeholder { color: #d4c8ea; }

  /* Editor & sidebar layout */
  .ne-editor-row { display: flex; gap: 0; }

  .ne-editor-area {
    flex: 1;
    min-height: 380px;
    max-height: 520px;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 14px 28px 28px;
    direction: ltr;
    text-align: left;
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.82;
    color: #2d1f4a;
    caret-color: #7c3aed;
    word-break: break-word;
  }

  .ne-editor-area:empty::before {
    content: attr(data-placeholder);
    color: #c4b3d8;
    font-style: italic;
    pointer-events: none;
  }

  .ne-editor-area::-webkit-scrollbar { width: 6px; }
  .ne-editor-area::-webkit-scrollbar-track { background: #f5f0fd; border-radius: 10px; }
  .ne-editor-area::-webkit-scrollbar-thumb { background: #c4b3e8; border-radius: 10px; }

  /* Stats sidebar */
  .ne-sidebar { width: 185px; flex-shrink: 0; padding: 18px 16px; border-left: 1px solid #f5f0fb; }

  .ne-insight {
    background: #faf7fd;
    border: 1px solid #ede6f8;
    border-radius: 13px;
    padding: 14px;
    position: sticky;
    top: 16px;
  }

  .ne-insight h4 {
    font-size: 10px;
    font-weight: 700;
    color: #c4b3d8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .ne-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
    font-size: 11.5px;
    border-top: 1px solid #ede6f8;
    color: #9b8bbf;
  }

  .ne-stat span:last-child { font-weight: 600; color: #6b47b8; }

  /* Bottom section */
  .ne-bottom { padding: 11px 28px 18px; border-top: 1px solid #f5f0fb; }

  .ne-tags-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .ne-tags-input {
    flex: 1;
    min-width: 140px;
    border: 1px solid #ddd6f0;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12.5px;
    outline: none;
    color: #3d2f66;
    background: #faf8fd;
    transition: border-color 0.14s, box-shadow 0.14s;
  }

  .ne-tags-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,.1); }

  .ne-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(167,139,250,0.14);
    color: #6b47b8;
    padding: 3px 10px 3px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    transition: background 0.12s;
  }

  .ne-tag:hover { background: rgba(167,139,250,0.24); }

  .ne-tag button {
    background: none;
    border: none;
    cursor: pointer;
    color: #b09ad8;
    display: flex;
    align-items: center;
    padding: 0;
    transition: color 0.12s;
  }

  .ne-tag button:hover { color: #dc2626; }
  .ne-tag button .ms { font-size: 14px; }

  /* Upload buttons */
  .ne-upload-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

  .ne-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 15px;
    border: 1px dashed #ddd6f0;
    border-radius: 10px;
    background: #faf7fd;
    font-size: 12.5px;
    font-weight: 500;
    color: #7c6fa0;
    cursor: pointer;
    transition: all 0.14s;
  }

  .ne-upload-btn:hover {
    background: #f0e8fb;
    border-color: #b09ad8;
    border-style: solid;
    color: #5a3da0;
  }

  .ne-upload-btn .ms { font-size: 17px; }

  /* Attachments */
  .ne-attachments {
    margin-top: 12px;
    background: #f9f5ff;
    border-radius: 10px;
    padding: 10px 13px;
  }

  .ne-att-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 6px;
    background: #fff;
    border-radius: 7px;
    margin-bottom: 5px;
  }

  .ne-att-link { color: #6b47b8; font-size: 12.5px; text-decoration: none; }
  .ne-att-link:hover { text-decoration: underline; }

  .ne-att-del {
    background: none;
    border: none;
    cursor: pointer;
    color: #c4b3d8;
    padding: 3px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    transition: color 0.12s, background 0.12s;
  }

  .ne-att-del:hover { color: #dc2626; background: #fee2e2; }
  .ne-att-del .ms { font-size: 15px; }

  /* Header */
  .ne-root { display: flex; min-height: 100vh; background: #f4f0fa; direction: ltr; }
  .ne-main { flex: 1; margin-left: 256px; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .ne-main::-webkit-scrollbar { width: 7px; }
  .ne-main::-webkit-scrollbar-track { background: #ede8f5; border-radius: 10px; }
  .ne-main::-webkit-scrollbar-thumb { background: #c4b3e8; border-radius: 10px; }

  .ne-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 22px;
    height: 58px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(196,179,232,0.28);
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 1px 0 rgba(103,75,181,0.05), 0 4px 14px rgba(103,75,181,0.04);
  }

  .ne-header-left { display: flex; align-items: center; gap: 8px; }

  .ne-back-btn {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px;
    border: none; background: transparent;
    border-radius: 9px; cursor: pointer; color: #7c6fa0;
    transition: background 0.14s, color 0.14s, transform 0.1s;
  }
  .ne-back-btn:hover { background: #f0e8fb; color: #5a3da0; transform: translateX(-1px); }

  .ne-header-title {
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    color: #2d1f4a;
    letter-spacing: -0.01em;
  }

  .ne-header-center { display: flex; align-items: center; gap: 5px; }

  .ne-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 11.5px; font-weight: 500;
    letter-spacing: 0.01em;
  }

  .ne-badge .ms { font-size: 13px; }
  .ne-badge-saved   { background: #e8faf0; color: #15803d; }
  .ne-badge-unsaved { background: #fff3eb; color: #c2410c; }
  .ne-badge-meta    { background: #ede9fe; color: #6d28d9; }

  .ne-header-right { display: flex; align-items: center; gap: 5px; }

  .ne-btn-ghost {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 11px;
    background: transparent;
    border: 1px solid #ddd6f0;
    border-radius: 8px; cursor: pointer;
    font-size: 12.5px; font-weight: 500; color: #4a3b6e;
    transition: all 0.14s; white-space: nowrap;
  }
  .ne-btn-ghost:hover { background: #f0e8fb; border-color: #b09ad8; color: #5a3da0; }

  .ne-btn-primary {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 7px 18px;
    background: linear-gradient(135deg, #7c3aed, #6b47b8);
    border: none; border-radius: 9px; cursor: pointer;
    font-size: 13px; font-weight: 600; color: #fff;
    transition: all 0.14s;
    box-shadow: 0 2px 10px rgba(124,58,237,0.35);
  }
  .ne-btn-primary:hover {
    background: linear-gradient(135deg, #6d28d9, #5a3da0);
    box-shadow: 0 4px 16px rgba(124,58,237,0.45);
    transform: translateY(-1px);
  }
  .ne-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  .ne-btn-cancel {
    padding: 6px 12px; background: transparent; border: none;
    border-radius: 8px; cursor: pointer;
    font-size: 12.5px; font-weight: 500; color: #7c6fa0;
    transition: background 0.14s;
  }
  .ne-btn-cancel:hover { background: #f0e8fb; }

  /* Body scroll area */
  .ne-body {
    flex: 1; overflow-y: auto; overflow-x: hidden; padding: 22px 24px;
  }
  .ne-body::-webkit-scrollbar { width: 7px; }
  .ne-body::-webkit-scrollbar-track { background: #ede8f5; border-radius: 10px; }
  .ne-body::-webkit-scrollbar-thumb { background: #c4b3e8; border-radius: 10px; }

  /* Page card */
  .ne-page {
    max-width: 900px; margin: 0 auto;
    background: #fff; border-radius: 18px;
    border: 1px solid #e8e0f4;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.9) inset,
      0 4px 24px rgba(103,75,181,0.07),
      0 1px 4px rgba(0,0,0,0.04);
    overflow: hidden;
    transition: background-color 0.25s ease;
  }

  /* Page top */
  .ne-page-top { padding: 18px 28px 0; }

  .ne-meta-row {
    display: flex; align-items: center;
    gap: 10px; margin-bottom: 10px; flex-wrap: wrap;
  }

  .ne-meta-date {
    font-size: 11px; font-weight: 600;
    color: #b0a0cc;
    letter-spacing: 0.04em; text-transform: uppercase;
  }

  .ne-cat-select {
    appearance: none; -webkit-appearance: none;
    background: #f7f2ff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23a78bfa' stroke-width='1.3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 8px center;
    border: 1px solid #ddd6f0; border-radius: 16px;
    padding: 4px 24px 4px 11px;
    font-size: 12px; font-weight: 500; color: #6b47b8;
    cursor: pointer; outline: none;
    transition: border-color 0.14s, background 0.14s;
  }
  .ne-cat-select:hover { background-color: #f0e8fb; border-color: #b09ad8; }

  /* Toast */
  .ne-toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    background: rgba(26,16,48,0.95); color: #e0d7f7;
    padding: 11px 18px; border-radius: 12px;
    font-size: 13px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 8px 28px rgba(0,0,0,.22);
    backdrop-filter: blur(4px);
    animation: toastSlideIn 0.22s cubic-bezier(.34,1.2,.64,1);
  }
  @keyframes toastSlideIn {
    from { opacity:0; transform: translateY(10px) scale(0.97); }
    to   { opacity:1; transform: translateY(0) scale(1); }
  }

  /* Overlays & Modals */
  .ne-overlay {
    position: fixed; inset: 0;
    background: rgba(20,10,40,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(5px);
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .ne-modal {
    background: #fff; border-radius: 20px; padding: 28px;
    width: 90%; max-width: 460px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(103,75,181,0.15);
    animation: modalPop 0.2s cubic-bezier(.34,1.2,.64,1);
  }
  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .ne-modal h3 {
    font-family: 'DM Serif Display', serif;
    font-size: 20px; color: #1a1030; margin-bottom: 6px;
  }

  .ne-modal p { font-size: 13px; color: #9b8bbf; margin-bottom: 16px; }

  .ne-modal-row { display: flex; gap: 8px; margin-bottom: 16px; }

  .ne-modal-row input {
    flex: 1; padding: 9px 13px;
    border: 1px solid #ddd6f0; border-radius: 9px;
    font-size: 13px; background: #faf8fd; color: #3d2f66; outline: none;
    transition: border-color 0.14s;
  }
  .ne-modal-row input:focus { border-color: #a78bfa; }

  .ne-modal-row button {
    background: #6b47b8; color: #fff; border: none;
    border-radius: 9px; padding: 0 16px;
    cursor: pointer; font-weight: 600; font-size: 13px;
    transition: background 0.14s;
  }
  .ne-modal-row button:hover { background: #5a3da0; }

  .ne-modal-close {
    width: 100%; padding: 10px;
    background: #f5f0ff; border: none; border-radius: 10px;
    cursor: pointer; font-size: 13px; font-weight: 500; color: #6b47b8;
    transition: background 0.14s;
  }
  .ne-modal-close:hover { background: #ede5f8; }

  /* Collab list in modal */
  .ne-collab-list { margin-top: 14px; border-top: 1px solid #f0ebf8; padding-top: 14px; }

  .ne-collab-list h4 {
    font-size: 11px; font-weight: 700; color: #b0a0cc;
    text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px;
  }

  .ne-collab-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0; border-bottom: 1px solid #f5f0fb;
  }

  .ne-collab-role {
    font-size: 10.5px; background: #f0e8fb; color: #7c3aed;
    padding: 2px 8px; border-radius: 12px; font-weight: 500;
  }

  .ne-collab-del {
    background: none; border: none; cursor: pointer;
    color: #c4b3d8; padding: 3px; border-radius: 5px;
    display: flex; align-items: center;
    transition: color 0.12s, background 0.12s;
  }
  .ne-collab-del:hover { color: #dc2626; background: #fee2e2; }

  /* Import modal */
  .ne-import-zone {
    border: 2px dashed #ddd6f0; border-radius: 13px;
    padding: 28px 20px; text-align: center; cursor: pointer;
    background: #faf8fd; transition: all 0.14s; margin-bottom: 14px;
  }
  .ne-import-zone:hover, .ne-import-zone.drag { border-color: #a78bfa; background: #f5f0ff; }
  .ne-import-zone .ms { font-size: 34px; color: #b09ad8; margin-bottom: 8px; display: block; }

  /* Export dropdown */
  .ne-export-wrap { position: relative; }
  .ne-export-menu {
    position: absolute; top: calc(100%+6px); right: 0;
    background: #fff; border: 1px solid #e6dff4; border-radius: 12px;
    box-shadow: 0 8px 28px rgba(103,75,181,0.14); z-index: 200;
    min-width: 178px; overflow: hidden;
    animation: menuIn 0.14s ease;
  }
  @keyframes menuIn {
    from { opacity:0; transform: translateY(-4px) scale(0.98); }
    to   { opacity:1; transform: translateY(0) scale(1); }
  }
  .ne-export-menu button {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 10px 14px;
    background: none; border: none; text-align: left;
    font-size: 13px; color: #3d2f66; cursor: pointer;
    transition: background 0.12s;
  }
  .ne-export-menu button:hover { background: #f5f0fd; }

  /* Loading / error inline */
  .ne-loading, .ne-error {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 50vh; gap: 14px; color: #9b8bbf;
  }
  .ne-spinner {
    width: 40px; height: 40px;
    border: 3px solid #ede6f8;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .ne-error .material-symbols-outlined { font-size: 44px; color: #dc2626; }
  .ne-error p { font-size: 15px; color: #6b5f82; text-align: center; }

  @media (max-width: 768px) {
    .ne-main { margin-left: 0; }
    .ne-sidebar { display: none; }
    .ne-note-colors { padding: 8px 16px; }
    .ne-editor-area { padding: 10px 16px 20px; min-height: 300px; }
    .ne-title-input { font-size: 22px; padding: 14px 16px 8px; }
    .ne-page-top { padding: 14px 16px 0; }
    .ne-bottom { padding: 8px 16px 14px; }
    .ne-header-center { display: none; }
  }
`

/* ─── Selection helpers ─────────────────────────────────────── */
const saveSelection = () => {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  return sel.getRangeAt(0).cloneRange()
}

const restoreSelection = (range) => {
  if (!range) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/* ─── Toolbar ───────────────────────────────────────────────── */
const Toolbar = ({ onFormat, onSave, onUndo, onRedo, onClearFormatting, isSaved, saving }) => {
  const [fontFamily, setFontFamily] = useState('DM Sans')
  const [fontSize, setFontSize] = useState('15')
  const [showTextColor, setShowTextColor] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [textColor, setTextColor] = useState('#2d1f4a')
  const [highlightColor, setHighlightColor] = useState('transparent')
  const [activeFormats, setActiveFormats] = useState({})
  const savedRangeRef = useRef(null)

  const fontFamilies = [
    'DM Sans','Georgia','Times New Roman','Arial','Courier New',
    'Verdana','Trebuchet MS','Palatino','Garamond','Tahoma',
    'Helvetica','Gill Sans','Century Gothic','Futura','Bookman Old Style',
  ]
  const fontSizes = [10,11,12,13,14,15,16,18,20,22,24,28,32,36,40,48,56,64,72]

  const colorPresets = [
    '#1a1030','#3d2f66','#6b47b8','#9b8bbf','#ffffff',
    '#dc2626','#ea580c','#d97706','#16a34a','#0891b2',
    '#4f46e5','#7c3aed','#c026d3','#e11d48','#374151',
  ]
  const highlightPresets = [
    'transparent','#fef9c3','#fef3c7','#dcfce7',
    '#dbeafe','#e0e7ff','#fce7f3','#ffedd5',
    '#fae8ff','#fee2e2','#f0fdf4','#eff6ff',
  ]

  useEffect(() => {
    const update = () => {
      try {
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight'),
          justifyFull: document.queryCommandState('justifyFull'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
        })
      } catch {}
    }
    const closeDrops = (e) => {
      if (!e.target.closest('.ne-color-wrap')) {
        setShowTextColor(false)
        setShowHighlight(false)
      }
    }
    document.addEventListener('selectionchange', update)
    document.addEventListener('mousedown', closeDrops)
    return () => {
      document.removeEventListener('selectionchange', update)
      document.removeEventListener('mousedown', closeDrops)
    }
  }, [])

  const openColorPicker = (type) => {
    savedRangeRef.current = saveSelection()
    if (type === 'text') { setShowTextColor(v => !v); setShowHighlight(false) }
    else { setShowHighlight(v => !v); setShowTextColor(false) }
  }

  const cmd = (command, value = null) => { if (onFormat) onFormat(command, value) }

  const applyFont = (f) => { setFontFamily(f); cmd('fontName', f) }
  const applySize = (s) => { setFontSize(s); cmd('fontSize', s) }

  const applyTextColor = (c) => {
    setTextColor(c)
    restoreSelection(savedRangeRef.current)
    cmd('foreColor', c)
    setShowTextColor(false)
  }

  const applyHighlight = (c) => {
    setHighlightColor(c)
    restoreSelection(savedRangeRef.current)
    cmd('hiliteColor', c === 'transparent' ? 'transparent' : c)
    setShowHighlight(false)
  }

  const insertLink = () => {
    const savedRange = saveSelection()
    const url = prompt('Enter URL:', 'https://')
    if (url && url !== 'https://') {
      restoreSelection(savedRange)
      cmd('createLink', url)
    }
  }

  const insertTable = () => {
    const r = parseInt(prompt('Rows:', '3') || '3')
    const c = parseInt(prompt('Columns:', '3') || '3')
    if (r && c) {
      let t = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin:12px 0">'
      for (let i = 0; i < r; i++) {
        t += '<tr>'
        for (let j = 0; j < c; j++)
          t += i === 0
            ? '<th style="border:1px solid #ddd6f0;padding:8px;background:#f5f0ff;color:#5a3da0">Header</th>'
            : '<td style="border:1px solid #ddd6f0;padding:8px">Cell</td>'
        t += '</tr>'
      }
      t += '</table>'
      cmd('insertHTML', t)
    }
  }

  const isActive = (f) => !!activeFormats[f]

  const getActiveHeading = () => {
    try {
      const sel = window.getSelection()
      if (!sel || !sel.anchorNode) return null
      let el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode
      while (el) {
        const tag = el.tagName?.toLowerCase()
        if (['h1','h2','h3'].includes(tag)) return tag
        el = el.parentElement
      }
    } catch {}
    return null
  }
  const activeHeading = getActiveHeading()

  return (
    <div className="ne-toolbar">
      {/* Quick Access */}
      <div className="ne-tb-group">
        <button
          className={`ne-tb-btn${!isSaved ? ' active' : ''}`}
          onClick={onSave}
          title={saving ? 'Saving…' : isSaved ? 'Saved' : 'Save (Ctrl+S)'}
        >
          <span className="material-symbols-outlined ms">{saving ? 'sync' : isSaved ? 'cloud_done' : 'save'}</span>
        </button>
        <button className="ne-tb-btn" onClick={onUndo} title="Undo (Ctrl+Z)">
          <span className="material-symbols-outlined ms">undo</span>
        </button>
        <button className="ne-tb-btn" onClick={onRedo} title="Redo (Ctrl+Y)">
          <span className="material-symbols-outlined ms">redo</span>
        </button>
        <button className="ne-tb-btn" onClick={onClearFormatting} title="Clear Formatting">
          <span className="material-symbols-outlined ms">format_clear</span>
        </button>
      </div>

      {/* Font */}
      <div className="ne-tb-group">
        <select className="ne-tb-select ne-tb-select-font" value={fontFamily} onChange={e => applyFont(e.target.value)}>
          {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="ne-tb-select ne-tb-select-size" value={fontSize} onChange={e => applySize(e.target.value)}>
          {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Text Formatting */}
      <div className="ne-tb-group">
        <button className={`ne-tb-btn${isActive('bold') ? ' active' : ''}`} onClick={() => cmd('bold')} title="Bold (Ctrl+B)">
          <span className="material-symbols-outlined ms">format_bold</span>
        </button>
        <button className={`ne-tb-btn${isActive('italic') ? ' active' : ''}`} onClick={() => cmd('italic')} title="Italic (Ctrl+I)">
          <span className="material-symbols-outlined ms">format_italic</span>
        </button>
        <button className={`ne-tb-btn${isActive('underline') ? ' active' : ''}`} onClick={() => cmd('underline')} title="Underline (Ctrl+U)">
          <span className="material-symbols-outlined ms">format_underlined</span>
        </button>
        <button className={`ne-tb-btn${isActive('strikeThrough') ? ' active' : ''}`} onClick={() => cmd('strikeThrough')} title="Strikethrough">
          <span className="material-symbols-outlined ms">format_strikethrough</span>
        </button>
      </div>

      {/* Colors */}
      <div className="ne-tb-group">
        <div className="ne-color-wrap">
          <button className="ne-color-btn" onClick={() => openColorPicker('text')} title="Text Color">
            <span className="material-symbols-outlined ms">format_color_text</span>
            <span className="ne-color-bar" style={{ backgroundColor: textColor, border: textColor === '#ffffff' ? '1px solid #ccc' : 'none' }} />
          </button>
          {showTextColor && (
            <div className="ne-color-dropdown" onMouseDown={e => e.stopPropagation()}>
              <span className="ne-color-label">Text Color</span>
              <div className="ne-color-grid">
                {colorPresets.map(c => (
                  <button
                    key={c}
                    className={`ne-swatch${c === textColor ? ' sel' : ''}`}
                    style={{ backgroundColor: c, border: c === '#ffffff' ? '1.5px solid #ddd' : undefined }}
                    onMouseDown={e => { e.preventDefault(); applyTextColor(c) }}
                  />
                ))}
              </div>
              <div className="ne-custom-row">
                <input type="color" value={textColor === '#ffffff' ? '#000000' : textColor}
                  onChange={e => applyTextColor(e.target.value)} />
                <span>Custom color</span>
              </div>
            </div>
          )}
        </div>

        <div className="ne-color-wrap">
          <button className="ne-color-btn" onClick={() => openColorPicker('highlight')} title="Highlight">
            <span className="material-symbols-outlined ms">format_color_fill</span>
            <span className="ne-color-bar" style={{ backgroundColor: highlightColor === 'transparent' ? '#fffde0' : highlightColor, border: '1px solid #ddd' }} />
          </button>
          {showHighlight && (
            <div className="ne-color-dropdown" onMouseDown={e => e.stopPropagation()}>
              <span className="ne-color-label">Highlight</span>
              <div className="ne-color-grid">
                {highlightPresets.map(c => (
                  <button
                    key={c}
                    className={`ne-swatch${c === highlightColor ? ' sel' : ''}`}
                    style={{ backgroundColor: c === 'transparent' ? '#f5f5f5' : c, border: '1.5px solid #ddd' }}
                    onMouseDown={e => { e.preventDefault(); applyHighlight(c) }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alignment */}
      <div className="ne-tb-group">
        <button className={`ne-tb-btn${isActive('justifyLeft') ? ' active' : ''}`} onClick={() => cmd('justifyLeft')} title="Align Left">
          <span className="material-symbols-outlined ms">format_align_left</span>
        </button>
        <button className={`ne-tb-btn${isActive('justifyCenter') ? ' active' : ''}`} onClick={() => cmd('justifyCenter')} title="Center">
          <span className="material-symbols-outlined ms">format_align_center</span>
        </button>
        <button className={`ne-tb-btn${isActive('justifyRight') ? ' active' : ''}`} onClick={() => cmd('justifyRight')} title="Align Right">
          <span className="material-symbols-outlined ms">format_align_right</span>
        </button>
        <button className={`ne-tb-btn${isActive('justifyFull') ? ' active' : ''}`} onClick={() => cmd('justifyFull')} title="Justify">
          <span className="material-symbols-outlined ms">format_align_justify</span>
        </button>
      </div>

      {/* Lists & Blocks */}
      <div className="ne-tb-group">
        <button className={`ne-tb-btn${isActive('insertUnorderedList') ? ' active' : ''}`} onClick={() => cmd('insertUnorderedList')} title="Bullet List">
          <span className="material-symbols-outlined ms">format_list_bulleted</span>
        </button>
        <button className={`ne-tb-btn${isActive('insertOrderedList') ? ' active' : ''}`} onClick={() => cmd('insertOrderedList')} title="Numbered List">
          <span className="material-symbols-outlined ms">format_list_numbered</span>
        </button>
        <button className="ne-tb-btn" onClick={() => cmd('formatBlock', 'blockquote')} title="Blockquote">
          <span className="material-symbols-outlined ms">format_quote</span>
        </button>
        <button className="ne-tb-btn" onClick={() => cmd('formatBlock', 'pre')} title="Code Block">
          <span className="material-symbols-outlined ms">code</span>
        </button>
        <button className="ne-tb-btn" onClick={() => cmd('outdent')} title="Outdent">
          <span className="material-symbols-outlined ms">format_indent_decrease</span>
        </button>
        <button className="ne-tb-btn" onClick={() => cmd('indent')} title="Indent">
          <span className="material-symbols-outlined ms">format_indent_increase</span>
        </button>
      </div>

      {/* Headings */}
      <div className="ne-tb-group">
        {[['h1','H1'],['h2','H2'],['h3','H3']].map(([tag, label]) => (
          <button
            key={tag}
            className={`ne-tb-heading-btn${activeHeading === tag ? ' active' : ''}`}
            onClick={() => {
              const sel = window.getSelection()
              if (!sel || !sel.anchorNode) return
              let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode
              let currentTag = null
              const editorEl = document.querySelector('.ne-editor-area')
              while (node && node !== editorEl) {
                const t = node.tagName?.toLowerCase()
                if (['h1','h2','h3'].includes(t)) { currentTag = t; break }
                node = node.parentElement
              }
              document.execCommand('formatBlock', false, currentTag === tag ? 'p' : tag)
            }}
            title={`Heading ${tag.slice(1)}`}
          >
            {label}
          </button>
        ))}
        <button className="ne-tb-heading-btn" onClick={() => cmd('formatBlock', 'p')} title="Normal" style={{ fontWeight: 400 }}>¶</button>
      </div>

      {/* Insert */}
      <div className="ne-tb-group">
        <button className="ne-tb-btn" onClick={insertLink} title="Insert Link">
          <span className="material-symbols-outlined ms">link</span>
        </button>
        <button className="ne-tb-btn" onClick={insertTable} title="Insert Table">
          <span className="material-symbols-outlined ms">table_rows</span>
        </button>
        <button
          className="ne-tb-btn"
          onClick={() => cmd('insertHTML', '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,#c4b3e8,transparent);margin:20px 0"/>')}
          title="Horizontal Rule"
        >
          <span className="material-symbols-outlined ms">horizontal_rule</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Main NoteEditor ───────────────────────────────────────── */
const NoteEditor = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token } = useAuth()
  const editorRef = useRef(null)
  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const importInputRef = useRef(null)
  const isComposingRef = useRef(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Personal')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isSaved, setIsSaved] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [noteColor, setNoteColor] = useState('#ffffff')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [collaborators, setCollaborators] = useState([])
  const [toast, setToast] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)

  const resizingRef = useRef(null)

  const availableCategories = ['Personal','Work','Ideas','Journal','Health','Finance','Travel','Education','Shopping','Recipes','Projects']
  const colorOptions = [
    { value: '#ffffff', name: 'Default' },
    { value: '#fef3c7', name: 'Yellow' },
    { value: '#fce7f3', name: 'Pink' },
    { value: '#e0e7ff', name: 'Lavender' },
    { value: '#dcfce7', name: 'Mint' },
    { value: '#ffedd5', name: 'Peach' },
    { value: '#dbeafe', name: 'Blue' },
    { value: '#f1f5f9', name: 'Slate' },
  ]

  const showToast = (msg, icon = 'check_circle') => {
    setToast({ msg, icon })
    setTimeout(() => setToast(null), 2500)
  }

  const calcStats = () => {
    const plain = (content || '').replace(/<[^>]*>/g, '')
    const words = plain.trim().split(/\s+/).filter(Boolean).length
    return { words, readTime: Math.max(1, Math.ceil(words / 200)) }
  }
  const { words, readTime } = calcStats()

  // Fetch folders
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/notes/folders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) setFolders(data.flatFolders || data.folders || [])
      } catch (err) { console.error('Error fetching folders:', err) }
    }
    if (token) fetchFolders()
  }, [token])

  useEffect(() => {
    if (id && id !== 'new') { fetchNote(); fetchCollaborators() }
  }, [id])

  useEffect(() => {
    const kd = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() } }
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  }, [title, content, category, tags, noteColor, selectedFolder])

  // Editor key / click setup
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.dir = 'ltr'

    const handleEditorClick = (e) => {
      const anchor = e.target.closest('a')
      if (anchor && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        window.open(anchor.href, '_blank', 'noopener,noreferrer')
      }
    }

    const kd = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) return
        let node = sel.anchorNode
        while (node && node !== el) {
          const tag = node.nodeName?.toLowerCase()
          if (['li','blockquote','pre','td','th'].includes(tag)) return
          node = node.parentNode
        }
        e.preventDefault()
        document.execCommand('insertHTML', false, '<br><br>')
        const sel2 = window.getSelection()
        if (sel2 && sel2.rangeCount) {
          const r = sel2.getRangeAt(0)
          r.setStart(r.startContainer, Math.max(0, r.startOffset - 1))
          r.collapse(true)
          sel2.removeAllRanges()
          sel2.addRange(r)
        }
        handleContentChange()
      }
    }

    el.addEventListener('keydown', kd)
    el.addEventListener('click', handleEditorClick)
    return () => {
      el.removeEventListener('keydown', kd)
      el.removeEventListener('click', handleEditorClick)
    }
  }, [])

  // Image selection
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const handleClick = (e) => {
      el.querySelectorAll('.ne-img-wrapper.selected').forEach(w => w.classList.remove('selected'))
      const wrapper = e.target.closest('.ne-img-wrapper')
      if (wrapper) { e.preventDefault(); wrapper.classList.add('selected') }
    }
    el.addEventListener('click', handleClick)
    return () => el.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!editorRef.current?.contains(e.target)) {
        editorRef.current?.querySelectorAll('.ne-img-wrapper.selected').forEach(w => w.classList.remove('selected'))
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  // Image resize
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current) return
      const { wrapper, startX, startW } = resizingRef.current
      const dx = (e.clientX || e.touches?.[0]?.clientX || startX) - startX
      const newW = Math.max(80, Math.min(startW + dx, wrapper.closest('.ne-editor-area')?.offsetWidth || 800))
      wrapper.style.width = `${newW}px`
      const label = wrapper.querySelector('.ne-img-size-label')
      if (label) label.textContent = `${Math.round(newW)}px`
    }
    const onUp = () => {
      if (resizingRef.current) { syncContent(); resizingRef.current = null }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const fetchNote = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok && data.success) {
        const n = data.note
        setTitle(n.title || '')
        setContent(n.content || '')
        setCategory(n.category || 'Personal')
        setTags(n.tags || [])
        setNoteColor(n.color || '#ffffff')
        setAttachments(n.attachments || [])
        setSelectedFolder(n.folder_id || null)
        if (editorRef.current) editorRef.current.innerHTML = n.content || ''
      } else { setError(data.message || 'Failed to load note') }
    } catch { setError('Unable to load note.') } finally { setLoading(false) }
  }

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}/collaborators`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok && data.success) setCollaborators(data.collaborators || [])
    } catch {}
  }

  const handleSave = async () => {
    if (!title.trim()) { showToast('Please enter a title', 'warning'); return }
    setSaving(true)
    try {
      const body = JSON.stringify({ title: title.trim(), content, category, tags, color: noteColor, attachments, folder_id: selectedFolder })
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      const res = id && id !== 'new'
        ? await fetch(`http://localhost:5000/api/notes/${id}`, { method: 'PUT', headers, body })
        : await fetch('http://localhost:5000/api/notes', { method: 'POST', headers, body })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsSaved(true)
        showToast('Note saved successfully')
        if (!id || id === 'new') navigate(`/editor/${data.note._id || data.note.id}`)
      } else { showToast(data.message || 'Failed to save', 'error') }
    } catch { showToast('Unable to save note.', 'error') } finally { setSaving(false) }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })
      if (res.ok) {
        setCollaborators([...collaborators, { email: inviteEmail, permission: 'viewer' }])
        setInviteEmail(''); setShowInviteModal(false)
        showToast('Invitation sent!')
      } else {
        const d = await res.json()
        showToast(d.message || 'Failed', 'error')
      }
    } catch { showToast('Unable to send invitation.', 'error') }
  }

  const handleRemoveCollaborator = async (email) => {
    if (!window.confirm(`Remove ${email}?`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/notes/${id}/collaborators`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (res.ok) setCollaborators(collaborators.filter(c => c.email !== email))
    } catch {}
  }

  const handleShare = async () => {
    const link = `${window.location.origin}/shared/${id || 'new'}`
    setShareLink(link)
    setShowShareModal(true)
    await navigator.clipboard.writeText(link).catch(() => {})
  }

  const handleExport = (format) => {
    const plain = content.replace(/<[^>]*>/g, '')
    const date = new Date().toLocaleDateString()
    if (format === 'md') {
      const md = `# ${title}\n\n> ${date} | ${category} | ${readTime} min read\n\n${plain}\n\n---\n*Exported from Lavender Notes*`
      downloadFile(md, `${title.replace(/\s+/g, '_')}.md`, 'text/markdown')
    } else if (format === 'txt') {
      const txt = `${title}\n${'='.repeat(title.length)}\n\n${date} | ${category}\n\n${plain}\n\n---\nExported from Lavender Notes`
      downloadFile(txt, `${title.replace(/\s+/g, '_')}.txt`, 'text/plain')
    } else if (format === 'html') {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body><h1>${title}</h1><div>${content}</div></body></html>`
      downloadFile(html, `${title.replace(/\s+/g, '_')}.html`, 'text/html')
    }
    setShowExportMenu(false)
  }

  const downloadFile = (c, name, type) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([c], { type }))
    a.download = name; a.click()
  }

  const handleImportFile = (file) => {
    if (!file) return
    const name = file.name.toLowerCase()
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        const body = doc.body?.innerHTML || text
        if (editorRef.current) { editorRef.current.innerHTML = body; syncContent() }
      } else {
        const html = text.split('\n').map(line => {
          if (/^### /.test(line)) return `<h3>${line.slice(4)}</h3>`
          if (/^## /.test(line)) return `<h2>${line.slice(3)}</h2>`
          if (/^# /.test(line)) return `<h1>${line.slice(2)}</h1>`
          if (line.trim() === '') return '<br>'
          return `<p>${line}</p>`
        }).join('')
        if (editorRef.current) { editorRef.current.innerHTML = html; syncContent() }
      }
      setShowImportModal(false); setIsSaved(false)
      showToast('File imported successfully')
    }
    reader.readAsText(file)
  }

  const handleFormat = useCallback((command, value) => {
    const el = editorRef.current
    if (!el) return
    el.focus()

    if (command === 'heading') {
      const sel = window.getSelection()
      if (!sel || !sel.anchorNode) return
      let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode
      let currentTag = null
      while (node && node !== el) {
        const tag = node.tagName?.toLowerCase()
        if (['h1','h2','h3'].includes(tag)) { currentTag = tag; break }
        node = node.parentElement
      }
      document.execCommand('formatBlock', false, currentTag === value ? 'p' : value)
      setTimeout(syncContent, 10)
      return
    }

    if (command === 'fontSize') {
      const sel = window.getSelection()
      if (sel && sel.rangeCount && !sel.isCollapsed) {
        const range = sel.getRangeAt(0)
        try {
          const span = document.createElement('span')
          span.style.fontSize = `${value}px`
          range.surroundContents(span)
        } catch {
          document.execCommand('styleWithCSS', false, true)
          document.execCommand('fontSize', false, '7')
          el.querySelectorAll('font[size="7"]').forEach(f => {
            const s = document.createElement('span')
            s.style.fontSize = `${value}px`
            f.replaceWith(s)
            while (f.firstChild) s.appendChild(f.firstChild)
          })
        }
      }
    } else if (command === 'foreColor' || command === 'hiliteColor') {
      document.execCommand('styleWithCSS', false, true)
      document.execCommand(command, false, value)
    } else {
      document.execCommand('styleWithCSS', false, true)
      document.execCommand(command, false, value)
    }

    setTimeout(syncContent, 10)
  }, [])

  const handleUndo = () => { document.execCommand('undo'); setTimeout(syncContent, 10) }
  const handleRedo = () => { document.execCommand('redo'); setTimeout(syncContent, 10) }

  const handleClearFormatting = () => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    document.execCommand('removeFormat', false, null)
    document.execCommand('unlink', false, null)
    try { document.execCommand('formatBlock', false, 'p') } catch {}
    setTimeout(syncContent, 10)
  }

  const syncContent = () => {
    if (editorRef.current) { setContent(editorRef.current.innerHTML); setIsSaved(false) }
  }
  const handleContentChange = () => syncContent()

  const handlePaste = (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      const clean = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
      document.execCommand('insertHTML', false, clean)
    } else {
      document.execCommand('insertText', false, text)
    }
    syncContent()
  }

  const buildImageWrapper = (src, width = 'auto') => {
    return `<span class="ne-img-wrapper" contenteditable="false" style="display:inline-block;position:relative;${width !== 'auto' ? 'width:' + width + 'px;' : ''}">` +
      `<img src="${src}" alt="Uploaded image" style="display:block;max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.08);" draggable="false"/>` +
      `<span class="ne-img-controls">` +
        `<button class="ne-img-align-btn" data-align="left" title="Align Left"><span class="material-symbols-outlined ms">format_align_left</span></button>` +
        `<button class="ne-img-align-btn" data-align="center" title="Center"><span class="material-symbols-outlined ms">format_align_center</span></button>` +
        `<button class="ne-img-align-btn" data-align="right" title="Align Right"><span class="material-symbols-outlined ms">format_align_right</span></button>` +
        `<span class="ne-img-controls-sep"></span>` +
        `<span class="ne-img-size-label">auto</span>` +
        `<span class="ne-img-controls-sep"></span>` +
        `<button class="ne-img-del-btn danger" title="Delete Image"><span class="material-symbols-outlined ms">delete</span></button>` +
      `</span>` +
      `<span class="ne-resize-handle" title="Drag to resize"></span>` +
    `</span>`
  }

  // Image controls delegation
  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const handleDelegation = (e) => {
      const alignBtn = e.target.closest('.ne-img-align-btn')
      if (alignBtn) {
        e.preventDefault(); e.stopPropagation()
        const wrapper = alignBtn.closest('.ne-img-wrapper')
        if (!wrapper) return
        const align = alignBtn.dataset.align
        if (align === 'left') { wrapper.style.cssText += ';float:left;margin:8px 14px 8px 0;' }
        else if (align === 'right') { wrapper.style.cssText += ';float:right;margin:8px 0 8px 14px;' }
        else { wrapper.style.float = ''; wrapper.style.margin = '8px auto'; wrapper.style.display = 'block' }
        syncContent(); return
      }

      const delBtn = e.target.closest('.ne-img-del-btn')
      if (delBtn) {
        e.preventDefault(); e.stopPropagation()
        const wrapper = delBtn.closest('.ne-img-wrapper')
        if (wrapper && window.confirm('Delete this image?')) { wrapper.remove(); syncContent() }
        return
      }

      const handle = e.target.closest('.ne-resize-handle')
      if (handle) {
        e.preventDefault()
        const wrapper = handle.closest('.ne-img-wrapper')
        if (!wrapper) return
        resizingRef.current = { wrapper, startX: e.clientX, startW: wrapper.offsetWidth || wrapper.querySelector('img').naturalWidth }
      }
    }

    el.addEventListener('mousedown', handleDelegation)
    return () => el.removeEventListener('mousedown', handleDelegation)
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please upload an image', 'error'); return }
    if (file.size > 10 * 1024 * 1024) { showToast('Image must be < 10MB', 'error'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      const html = buildImageWrapper(reader.result)
      if (editorRef.current) {
        editorRef.current.focus()
        document.execCommand('insertHTML', false, html + '&nbsp;')
        syncContent()
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    const url = URL.createObjectURL(file)
    setAttachments(a => [...a, { id: Date.now(), name: file.name, url, type: file.type }])
    setIsSaved(false)
    e.target.value = ''
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) setTags(t => [...t, tagInput.trim()])
      setTagInput(''); setIsSaved(false)
    }
  }

  const handleCancel = () => {
    if (!isSaved && (title || content)) {
      if (window.confirm('Unsaved changes. Leave anyway?')) navigate('/dashboard')
    } else navigate('/dashboard')
  }

  const MS_LINK = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'

  if (loading) return (
    <div className="ne-root">
      <style>{styles}</style>
      <link rel="stylesheet" href={MS_LINK} />
      <Sidebar />
      <div className="ne-main">
        <div className="ne-loading">
          <div className="ne-spinner" />
          <p>Loading note…</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="ne-root">
      <style>{styles}</style>
      <link rel="stylesheet" href={MS_LINK} />
      <Sidebar />
      <div className="ne-main">
        <div className="ne-error">
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#dc2626' }}>error_outline</span>
          <p>{error}</p>
          <button className="ne-btn-primary" onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined ms">arrow_back</span> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="ne-root">
      <style>{styles}</style>
      <link rel="stylesheet" href={MS_LINK} />
      <Sidebar />

      <div className="ne-main">

        {/* ── Header ───────────────────────────────────────── */}
        <header className="ne-header">
          <div className="ne-header-left">
            <button className="ne-back-btn" onClick={handleCancel} title="Back">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="ne-header-title">Lavender Notes</span>
          </div>

          <div className="ne-header-center">
            <span className={`ne-badge ${isSaved ? 'ne-badge-saved' : 'ne-badge-unsaved'}`}>
              <span className="material-symbols-outlined ms">{isSaved ? 'check_circle' : 'edit_note'}</span>
              {isSaved ? 'Saved' : 'Unsaved'}
            </span>
            <span className="ne-badge ne-badge-meta">
              <span className="material-symbols-outlined ms">schedule</span>{readTime} min
            </span>
            <span className="ne-badge ne-badge-meta">
              <span className="material-symbols-outlined ms">folder</span>{category}
            </span>
            {collaborators.length > 0 && (
              <span className="ne-badge ne-badge-meta">
                <span className="material-symbols-outlined ms">group</span>{collaborators.length}
              </span>
            )}
          </div>

          <div className="ne-header-right">
            <button className="ne-btn-ghost" onClick={() => setShowInviteModal(true)}>
              <span className="material-symbols-outlined ms">person_add</span>Invite
            </button>
            <button className="ne-btn-ghost" onClick={handleShare}>
              <span className="material-symbols-outlined ms">share</span>Share
            </button>
            <button className="ne-btn-ghost" onClick={() => setShowImportModal(true)}>
              <span className="material-symbols-outlined ms">upload_file</span>Import
            </button>
            <div className="ne-export-wrap">
              <button className="ne-btn-ghost" onClick={() => setShowExportMenu(v => !v)}>
                <span className="material-symbols-outlined ms">download</span>Export
              </button>
              {showExportMenu && (
                <div className="ne-export-menu">
                  <button onClick={() => handleExport('md')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>Markdown (.md)
                  </button>
                  <button onClick={() => handleExport('txt')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>text_snippet</span>Plain Text (.txt)
                  </button>
                  <button onClick={() => handleExport('html')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>code</span>HTML (.html)
                  </button>
                </div>
              )}
            </div>
            <button className="ne-btn-cancel" onClick={handleCancel}>Cancel</button>
            <button className="ne-btn-primary" onClick={handleSave} disabled={saving}>
              <span className="material-symbols-outlined ms">save</span>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <Toolbar
          onFormat={handleFormat}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearFormatting={handleClearFormatting}
          isSaved={isSaved}
          saving={saving}
        />

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="ne-body">
          <div className="ne-page" style={{ backgroundColor: noteColor }}>

            {/* Meta row */}
            <div className="ne-page-top">
              <div className="ne-meta-row">
                <span className="ne-meta-date">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <select
                  className="ne-cat-select"
                  value={category}
                  onChange={e => { setCategory(e.target.value); setIsSaved(false) }}
                >
                  {availableCategories.map(c => <option key={c} value={c}>📁 {c}</option>)}
                </select>
                {folders.length > 0 && (
                  <select
                    className="ne-cat-select"
                    value={selectedFolder || ''}
                    onChange={e => { setSelectedFolder(e.target.value || null); setIsSaved(false) }}
                  >
                    <option value="">📂 No Folder</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.icon || '📁'} {f.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Note color chips */}
            <div className="ne-note-colors">
              <span className="ne-note-colors-label">Color</span>
              {colorOptions.map(c => (
                <button
                  key={c.value}
                  className={`ne-note-chip${noteColor === c.value ? ' active' : ''}`}
                  style={{ backgroundColor: c.value, border: c.value === '#ffffff' ? '1.5px solid #e8e0f4' : 'none' }}
                  title={c.name}
                  onClick={() => { setNoteColor(c.value); setIsSaved(false) }}
                />
              ))}
            </div>

            {/* Title */}
            <input
              className="ne-title-input"
              type="text"
              placeholder="Title your thoughts…"
              value={title}
              onChange={e => { setTitle(e.target.value); setIsSaved(false) }}
              dir="ltr"
            />

            {/* Editor + Stats */}
            <div className="ne-editor-row">
              <div
                ref={editorRef}
                className="ne-editor-area"
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentChange}
                onPaste={handlePaste}
                onCompositionStart={() => { isComposingRef.current = true }}
                onCompositionEnd={() => { isComposingRef.current = false; handleContentChange() }}
                dir="ltr"
                style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'isolate' }}
                data-placeholder="Start writing your note…"
              />
              <div className="ne-sidebar">
                <div className="ne-insight">
                  <h4>Stats</h4>
                  <div className="ne-stat"><span>Words</span><span>{words}</span></div>
                  <div className="ne-stat"><span>Chars</span><span>{(content || '').replace(/<[^>]*>/g, '').length}</span></div>
                  <div className="ne-stat"><span>Read</span><span>{readTime} min</span></div>
                  {id && id !== 'new' && (
                    <div className="ne-stat">
                      <span>ID</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>#{id.slice(-6)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags + Upload */}
            <div className="ne-bottom">
              <div className="ne-tags-row">
                <input
                  className="ne-tags-input"
                  placeholder="Add tags (Enter to confirm)…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                {tags.map((t, i) => (
                  <span key={i} className="ne-tag">
                    {t}
                    <button onClick={() => { setTags(tags.filter(x => x !== t)); setIsSaved(false) }}>
                      <span className="material-symbols-outlined ms">close</span>
                    </button>
                  </span>
                ))}
              </div>

              <div className="ne-upload-row">
                <button className="ne-upload-btn" onClick={() => imageInputRef.current?.click()}>
                  <span className="material-symbols-outlined ms">add_photo_alternate</span>Add Image
                </button>
                <button className="ne-upload-btn" onClick={() => fileInputRef.current?.click()}>
                  <span className="material-symbols-outlined ms">attach_file</span>Attach File
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                <input ref={importInputRef} type="file" accept=".txt,.md,.html,.htm" onChange={e => handleImportFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>

              {attachments.length > 0 && (
                <div className="ne-attachments">
                  {attachments.map(a => (
                    <div key={a.id} className="ne-att-item">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="ne-att-link">📎 {a.name}</a>
                      <button className="ne-att-del" onClick={() => { setAttachments(att => att.filter(x => x.id !== a.id)); setIsSaved(false) }}>
                        <span className="material-symbols-outlined ms">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Share Modal ───────────────────────────────────── */}
      {showShareModal && (
        <div className="ne-overlay" onClick={() => setShowShareModal(false)}>
          <div className="ne-modal" onClick={e => e.stopPropagation()}>
            <h3>Share Note</h3>
            <p>Copy this link to share with others.</p>
            <div className="ne-modal-row">
              <input type="text" value={shareLink} readOnly />
              <button onClick={() => { navigator.clipboard.writeText(shareLink); showToast('Link copied!') }}>Copy</button>
            </div>
            <button className="ne-modal-close" onClick={() => setShowShareModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── Invite Modal ──────────────────────────────────── */}
      {showInviteModal && (
        <div className="ne-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="ne-modal" onClick={e => e.stopPropagation()}>
            <h3>Invite Collaborators</h3>
            <p>Add people by email address.</p>
            <div className="ne-modal-row">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
              <button onClick={handleInvite}>Invite</button>
            </div>
            {collaborators.length > 0 && (
              <div className="ne-collab-list">
                <h4>Current Collaborators</h4>
                {collaborators.map((c, i) => (
                  <div key={i} className="ne-collab-item">
                    <span style={{ fontSize: '12.5px', color: '#3d2f66', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</span>
                    <span className="ne-collab-role">{c.permission || 'viewer'}</span>
                    <button className="ne-collab-del" onClick={() => handleRemoveCollaborator(c.email)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="ne-modal-close" onClick={() => setShowInviteModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── Import Modal ──────────────────────────────────── */}
      {showImportModal && (
        <div className="ne-overlay" onClick={() => setShowImportModal(false)}>
          <div className="ne-modal" onClick={e => e.stopPropagation()}>
            <h3>Import File</h3>
            <p>Import from .txt, .md, or .html. This will replace the current content.</p>
            <div
              className={`ne-import-zone${isDragOver ? ' drag' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); handleImportFile(e.dataTransfer.files[0]) }}
              onClick={() => importInputRef.current?.click()}
            >
              <span className="material-symbols-outlined ms">upload_file</span>
              <p>Drag & drop or click to browse</p>
              <p style={{ fontSize: '11px', marginTop: '5px', color: '#c4b3d8' }}>Supports .txt · .md · .html</p>
            </div>
            <button className="ne-modal-close" onClick={() => setShowImportModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className="ne-toast">
          <span className="material-symbols-outlined ms">{toast.icon}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export default NoteEditor