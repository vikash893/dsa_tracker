import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/users')
      .then((res) => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>👥 Manage Users</h1>
        <p>View and manage all platform users</p>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <p>No users found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>XP</th>
                <th>Level</th>
                <th>Streak</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.displayName || `${u.firstName} ${u.lastName}`}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className="badge badge-role">{u.role?.replace('_', ' ')}</span></td>
                  <td>{u.xp || 0}</td>
                  <td>{u.level || 1}</td>
                  <td>{u.currentStreak || 0} 🔥</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
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
