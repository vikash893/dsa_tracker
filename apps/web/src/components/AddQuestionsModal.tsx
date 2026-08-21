import React, { useState } from 'react';
import { api, apiUpload } from '../lib/api';

interface QuestionRow {
  id: string;
  title: string;
  problemUrl: string;
  platform: 'LEETCODE' | 'CODEFORCES' | 'CODECHEF' | 'GFG' | 'CUSTOM';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  topics: string;
  points: number | '';
}

interface AddQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'table' | 'urls' | 'file' | 'json';

export default function AddQuestionsModal({ isOpen, onClose, onSuccess }: AddQuestionsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    duplicates?: number;
    failed?: number;
    total?: number;
    errors?: { index?: number; row?: number; url?: string; title?: string; message: string }[];
  } | null>(null);

  // ── Tab 1: Multi-Row Table State ──
  const [rows, setRows] = useState<QuestionRow[]>([
    { id: '1', title: '', problemUrl: '', platform: 'LEETCODE', difficulty: 'MEDIUM', topics: '', points: '' },
    { id: '2', title: '', problemUrl: '', platform: 'LEETCODE', difficulty: 'EASY', topics: '', points: '' },
  ]);

  // ── Tab 2: Bulk URLs State ──
  const [urlsText, setUrlsText] = useState('');
  const [urlDefaultDifficulty, setUrlDefaultDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [urlDefaultTopics, setUrlDefaultTopics] = useState('');

  // ── Tab 3: File Upload State ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ── Tab 4: JSON State ──
  const [jsonText, setJsonText] = useState('');

  if (!isOpen) return null;

  function resetForm() {
    setResult(null);
    setError(null);
    setRows([
      { id: '1', title: '', problemUrl: '', platform: 'LEETCODE', difficulty: 'MEDIUM', topics: '', points: '' },
      { id: '2', title: '', problemUrl: '', platform: 'LEETCODE', difficulty: 'EASY', topics: '', points: '' },
    ]);
    setUrlsText('');
    setSelectedFile(null);
    setJsonText('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // ── URL Platform & Title Detector for UI ──
  function detectFromUrl(url: string): { platform: QuestionRow['platform']; title?: string } | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (/leetcode\.com\/problems?\/([\w-]+)/i.test(trimmed)) {
      const match = trimmed.match(/leetcode\.com\/problems?\/([\w-]+)/i);
      const slug = match ? match[1] : '';
      const title = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
      return { platform: 'LEETCODE', title };
    }
    if (/codeforces\.com\/(?:problemset\/)?problem\/(\d+)\/([A-Z]\d?)/i.test(trimmed)) {
      const match = trimmed.match(/codeforces\.com\/(?:problemset\/)?problem\/(\d+)\/([A-Z]\d?)/i);
      const problemId = match ? `${match[1]}${match[2]}` : '';
      return { platform: 'CODEFORCES', title: problemId ? `Problem ${problemId}` : undefined };
    }
    if (/codechef\.com\/(?:problems|submit)\/([\w]+)/i.test(trimmed)) {
      const match = trimmed.match(/codechef\.com\/(?:problems|submit)\/([\w]+)/i);
      return { platform: 'CODECHEF', title: match ? match[1] : undefined };
    }
    if (/geeksforgeeks\.org\/problems?\/([\w-]+)/i.test(trimmed)) {
      const match = trimmed.match(/geeksforgeeks\.org\/problems?\/([\w-]+)/i);
      const slug = match ? match[1] : '';
      const title = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : undefined;
      return { platform: 'GFG', title };
    }
    return null;
  }

  // ── Row Form Handlers ──
  function updateRow(id: string, field: keyof QuestionRow, value: any) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'problemUrl' && value) {
          const detected = detectFromUrl(value);
          if (detected) {
            updated.platform = detected.platform;
            if (!updated.title && detected.title) {
              updated.title = detected.title;
            }
          }
        }
        return updated;
      })
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        title: '',
        problemUrl: '',
        platform: 'LEETCODE',
        difficulty: 'MEDIUM',
        topics: '',
        points: '',
      },
    ]);
  }

  function duplicateRow(id: string) {
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    setRows((prev) => [
      ...prev,
      {
        ...target,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        title: target.title ? `${target.title} (Copy)` : '',
      },
    ]);
  }

  function removeRow(id: string) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Submit Handlers ──

  async function handleTableSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validRows = rows.filter((r) => r.title.trim().length > 0 || r.problemUrl.trim().length > 0);
    if (validRows.length === 0) {
      setError('Please provide at least one question title or URL.');
      return;
    }

    const payload = validRows.map((r) => {
      const topicsArr = r.topics
        ? r.topics.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      return {
        title: r.title.trim() || 'Untitled Problem',
        problemUrl: r.problemUrl.trim() || undefined,
        platform: r.platform,
        difficulty: r.difficulty,
        topics: topicsArr,
        points: typeof r.points === 'number' ? r.points : undefined,
      };
    });

    setLoading(true);
    try {
      const res = await api('/questions/bulk', 'POST', { questions: payload });
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) {
      setError('Please enter at least one valid URL.');
      return;
    }

    const topicsArr = urlDefaultTopics
      ? urlDefaultTopics.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    setLoading(true);
    try {
      const res = await api('/questions/import/urls', 'POST', {
        urls,
        defaultDifficulty: urlDefaultDifficulty,
        topics: topicsArr,
      });
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import URLs');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a CSV file to upload.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await apiUpload('/questions/import/excel', formData);
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  }

  async function handleJsonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const parsed = JSON.parse(jsonText);
      const questionsArray = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error('JSON must be an array of question objects, or an object with a "questions" array.');
      }

      setLoading(true);
      const res = await api('/questions/bulk', 'POST', { questions: questionsArray });
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
    } finally {
      setLoading(false);
    }
  }

  function downloadSampleCsv() {
    const csvContent =
      'title,platform,url,difficulty,topic,company,points\n' +
      '"Two Sum","LEETCODE","https://leetcode.com/problems/two-sum/","EASY","Array,Hash Table","Amazon,Google",10\n' +
      '"Watermelon","CODEFORCES","https://codeforces.com/problemset/problem/4/A","EASY","Math,Brute Force","Meta",10\n' +
      '"Longest Palindromic Substring","LEETCODE","https://leetcode.com/problems/longest-palindromic-substring/","MEDIUM","String,Dynamic Programming","Microsoft",20\n' +
      '"Chef and Rainbow Array","CODECHEF","https://www.codechef.com/problems/RAINBOWA","EASY","Arrays","Directi",10';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'dsatracker_questions_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Count detected URLs in Tab 2
  const parsedUrls = urlsText.split('\n').map((u) => u.trim()).filter(Boolean);
  const detectedSummary = parsedUrls.reduce((acc, u) => {
    const d = detectFromUrl(u);
    const p = d ? d.platform : 'Unknown/Custom';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">➕ Add Multiple Questions</h2>
            <p className="modal-subtitle">Add DSA problems in bulk using table rows, problem URLs, CSV file, or JSON.</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Tab Navigation */}
        {!result && (
          <div className="modal-tabs">
            <button
              className={`modal-tab ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => { setActiveTab('table'); setError(null); }}
            >
              📝 Table Builder
            </button>
            <button
              className={`modal-tab ${activeTab === 'urls' ? 'active' : ''}`}
              onClick={() => { setActiveTab('urls'); setError(null); }}
            >
              🔗 Bulk URLs ({parsedUrls.length})
            </button>
            <button
              className={`modal-tab ${activeTab === 'file' ? 'active' : ''}`}
              onClick={() => { setActiveTab('file'); setError(null); }}
            >
              📁 CSV / Excel
            </button>
            <button
              className={`modal-tab ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => { setActiveTab('json'); setError(null); }}
            >
              {'{ }'} JSON
            </button>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {/* Results Screen */}
        {result ? (
          <div className="import-result-view">
            <div className="import-result-header">
              <div className="import-result-icon">🎉</div>
              <h3>Import Summary</h3>
              <p>Processed {result.total || (result.imported + (result.duplicates || 0) + (result.failed || 0))} question(s)</p>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-label">✅ Added</div>
                <div className="stat-value" style={{ fontSize: 24, color: 'var(--success)' }}>{result.imported}</div>
              </div>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-label">⚠️ Duplicates</div>
                <div className="stat-value" style={{ fontSize: 24, color: 'var(--warning)' }}>{result.duplicates || 0}</div>
              </div>
              <div className="stat-card" style={{ padding: 14 }}>
                <div className="stat-label">❌ Failed</div>
                <div className="stat-value" style={{ fontSize: 24, color: 'var(--danger)' }}>{result.failed || 0}</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="result-errors-box">
                <h4>Error Details:</h4>
                <ul>
                  {result.errors.map((e, idx) => (
                    <li key={idx}>
                      <strong>{e.row ? `Row ${e.row}` : e.index ? `#${e.index}` : ''} {e.title || e.url || ''}:</strong> {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={resetForm}>Add More Questions</button>
              <button className="btn btn-primary" onClick={handleClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab 1: Multi-Row Table Builder */}
            {activeTab === 'table' && (
              <form onSubmit={handleTableSubmit}>
                <div className="dynamic-table-container">
                  <table className="dynamic-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>Problem URL (Optional)</th>
                        <th style={{ width: '24%' }}>Title *</th>
                        <th style={{ width: '14%' }}>Platform</th>
                        <th style={{ width: '13%' }}>Difficulty</th>
                        <th style={{ width: '15%' }}>Topics (comma-separated)</th>
                        <th style={{ width: '6%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              className="input input-sm"
                              placeholder="https://leetcode.com/problems/..."
                              value={row.problemUrl}
                              onChange={(e) => updateRow(row.id, 'problemUrl', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="input input-sm"
                              placeholder="e.g. Two Sum"
                              value={row.title}
                              onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                              required={!row.problemUrl}
                            />
                          </td>
                          <td>
                            <select
                              className="input input-sm"
                              value={row.platform}
                              onChange={(e) => updateRow(row.id, 'platform', e.target.value)}
                            >
                              <option value="LEETCODE">LeetCode</option>
                              <option value="CODEFORCES">Codeforces</option>
                              <option value="CODECHEF">CodeChef</option>
                              <option value="GFG">GFG</option>
                              <option value="CUSTOM">Custom</option>
                            </select>
                          </td>
                          <td>
                            <select
                              className="input input-sm"
                              value={row.difficulty}
                              onChange={(e) => updateRow(row.id, 'difficulty', e.target.value)}
                            >
                              <option value="EASY">Easy</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HARD">Hard</option>
                              <option value="EXPERT">Expert</option>
                            </select>
                          </td>
                          <td>
                            <input
                              className="input input-sm"
                              placeholder="Array, Trees"
                              value={row.topics}
                              onChange={(e) => updateRow(row.id, 'topics', e.target.value)}
                            />
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Duplicate row"
                              onClick={() => duplicateRow(row.id)}
                            >
                              📋
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              title="Delete row"
                              disabled={rows.length <= 1}
                              onClick={() => removeRow(row.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
                    ➕ Add Another Row
                  </button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={handleClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Adding Questions...' : `Submit ${rows.filter((r) => r.title || r.problemUrl).length} Question(s)`}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tab 2: Bulk URLs Import */}
            {activeTab === 'urls' && (
              <form onSubmit={handleUrlsSubmit}>
                <div className="form-group">
                  <label>Paste Problem URLs (one per line):</label>
                  <textarea
                    className="input"
                    rows={7}
                    placeholder={`https://leetcode.com/problems/two-sum/\nhttps://codeforces.com/problemset/problem/4/A\nhttps://www.codechef.com/problems/RAINBOWA\nhttps://www.geeksforgeeks.org/problems/subarray-with-given-sum/1`}
                    value={urlsText}
                    onChange={(e) => setUrlsText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                    required
                  />
                </div>

                {parsedUrls.length > 0 && (
                  <div className="url-preview-bar">
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Detected platforms:</span>
                    {Object.entries(detectedSummary).map(([platform, count]) => (
                      <span key={platform} className="badge badge-role">
                        {platform}: {count}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                  <div className="form-group">
                    <label>Default Difficulty (if undetected):</label>
                    <select
                      className="input"
                      value={urlDefaultDifficulty}
                      onChange={(e: any) => setUrlDefaultDifficulty(e.target.value)}
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Default Topics (applied to all):</label>
                    <input
                      className="input"
                      placeholder="e.g. Dynamic Programming, Graph"
                      value={urlDefaultTopics}
                      onChange={(e) => setUrlDefaultTopics(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || parsedUrls.length === 0}>
                    {loading ? 'Importing...' : `Import ${parsedUrls.length} Problem(s)`}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: CSV / Excel Upload */}
            {activeTab === 'file' && (
              <form onSubmit={handleFileSubmit}>
                <div
                  className="file-dropzone"
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {selectedFile ? selectedFile.name : 'Click or Drag & Drop CSV / Excel File'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Supported formats: .csv, .xlsx, .xls (max 10MB)
                  </p>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={downloadSampleCsv}
                  >
                    📥 Download Sample CSV Template
                  </button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={handleClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading || !selectedFile}>
                      {loading ? 'Uploading & Parsing...' : 'Upload & Import Questions'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tab 4: JSON Batch Import */}
            {activeTab === 'json' && (
              <form onSubmit={handleJsonSubmit}>
                <div className="form-group">
                  <label>Paste JSON Array of Questions:</label>
                  <textarea
                    className="input"
                    rows={8}
                    placeholder={`[\n  {\n    "title": "Two Sum",\n    "platform": "LEETCODE",\n    "difficulty": "EASY",\n    "problemUrl": "https://leetcode.com/problems/two-sum/",\n    "topics": ["Array", "Hash Table"]\n  }\n]`}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading || !jsonText.trim()}>
                    {loading ? 'Importing JSON...' : 'Import JSON Questions'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
