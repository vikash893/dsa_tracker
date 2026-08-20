import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = search ? `/questions/search?q=${encodeURIComponent(search)}` : `/questions?page=${page}&limit=20`;
    api(q)
      .then((res) => {
        setQuestions(search ? (res.data || []) : (res.data || []));
        setTotal(res.pagination?.total || res.data?.length || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <>
      <div className="page-header">
        <h1>Questions</h1>
        <p>Browse and manage coding problems</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          className="input"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} total</span>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>{search ? 'No matching questions found' : 'No questions added yet'}</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Platform</th>
                  <th>Difficulty</th>
                  <th>Topics</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, i: number) => (
                  <tr key={q._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + i + 1}</td>
                    <td>
                      {q.problemUrl ? (
                        <a href={q.problemUrl} target="_blank" rel="noreferrer">{q.title}</a>
                      ) : q.title}
                    </td>
                    <td><span className="badge badge-role">{q.platform}</span></td>
                    <td>
                      <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{q.topics?.slice(0, 3).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!search && total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page}</span>
              <button className="btn btn-secondary btn-sm" disabled={questions.length < 20} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
