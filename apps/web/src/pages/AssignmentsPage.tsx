import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/assignments')
      .then((res) => setAssignments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function statusColor(s: string) {
    if (s === 'COMPLETED') return 'var(--success)';
    if (s === 'IN_PROGRESS') return 'var(--warning)';
    return 'var(--text-muted)';
  }

  return (
    <>
      <div className="page-header">
        <h1>📋 Assignments</h1>
        <p>Your assigned problems and progress</p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : assignments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No assignments yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a: any) => (
                <tr key={a._id}>
                  <td>{a.questionId?.title || 'Unknown'}</td>
                  <td>
                    <span className={`badge badge-${a.questionId?.difficulty?.toLowerCase()}`}>
                      {a.questionId?.difficulty || '?'}
                    </span>
                  </td>
                  <td><span style={{ color: statusColor(a.status), fontWeight: 600 }}>{a.status?.replace('_', ' ')}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
