import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AddQuestionsModal from '../components/AddQuestionsModal';

export default function QuestionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuestions = useCallback(() => {
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

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await api(`/questions/${id}`, 'DELETE');
      fetchQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete question');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Questions</h1>
          <p>Browse and manage coding problems</p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>➕</span>
            <span>Add Questions</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          className="input"
          placeholder="Search questions by title, topics, companies..."
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
          {isAdmin && !search && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setIsAddModalOpen(true)}
            >
              ➕ Add Your First Questions
            </button>
          )}
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
                  <th>Points</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, i: number) => (
                  <tr key={q._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + i + 1}</td>
                    <td>
                      {q.problemUrl ? (
                        <a href={q.problemUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                          {q.title} ↗
                        </a>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{q.title}</span>
                      )}
                    </td>
                    <td><span className="badge badge-role">{q.platform}</span></td>
                    <td>
                      <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{q.topics?.slice(0, 3).join(', ') || '—'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{q.points || 0}</td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-icon btn-icon-danger"
                          title="Delete Question"
                          disabled={deletingId === q._id}
                          onClick={() => handleDelete(q._id, q.title)}
                        >
                          {deletingId === q._id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    )}
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

      {/* Bulk Add Questions Modal */}
      <AddQuestionsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchQuestions}
      />
    </>
  );
}

