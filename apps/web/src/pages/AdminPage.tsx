import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api('/admin/stats').then((res) => setStats(res.data)).catch(() => {}),
      api('/admin/audit-logs').then((res) => setLogs(res.data || [])).catch(() => setLogs([])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Platform overview and audit trail</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Groups</div>
          <div className="stat-value">{stats?.totalGroups || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Questions</div>
          <div className="stat-value">{stats?.totalQuestions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Submissions</div>
          <div className="stat-value">{stats?.totalSubmissions || 0}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📜 Recent Audit Logs</h2>
        {logs.length === 0 ? (
          <div className="empty-state"><p>No audit logs yet</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Resource</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 15).map((log: any) => (
                  <tr key={log._id}>
                    <td><span className="badge badge-role">{log.action}</span></td>
                    <td>{log.userId?.email || log.userId || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{log.resourceType} {log.resourceId ? `(${String(log.resourceId).slice(-6)})` : ''}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
