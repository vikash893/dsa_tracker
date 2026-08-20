import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Tab = 'overall' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('overall');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = tab === 'overall' ? '/leaderboard' : `/leaderboard/${tab}`;
    api(endpoint)
      .then((res) => setEntries(res.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab]);

  function rankClass(i: number) {
    if (i === 0) return 'rank-1';
    if (i === 1) return 'rank-2';
    if (i === 2) return 'rank-3';
    return 'rank-default';
  }

  return (
    <>
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>See how you stack up against the competition</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['overall', 'weekly', 'monthly'] as Tab[]).map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏅</div>
          <p>No leaderboard data yet. Start solving!</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Solved</th>
                <th>Easy</th>
                <th>Medium</th>
                <th>Hard</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any, i: number) => (
                <tr key={e.userId || i}>
                  <td><span className={`rank-badge ${rankClass(i)}`}>{i + 1}</span></td>
                  <td style={{ fontWeight: 600 }}>{e.displayName || e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'User'}</td>
                  <td style={{ fontWeight: 700 }}>{e.totalSolved}</td>
                  <td><span style={{ color: 'var(--easy)' }}>{e.easySolved || 0}</span></td>
                  <td><span style={{ color: 'var(--medium)' }}>{e.mediumSolved || 0}</span></td>
                  <td><span style={{ color: 'var(--hard)' }}>{e.hardSolved || 0}</span></td>
                  <td>{e.currentStreak || 0} 🔥</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
