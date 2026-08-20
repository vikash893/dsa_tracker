import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);

  useEffect(() => {
    api('/analytics/me').then((res) => setAnalytics(res.data)).catch(() => {});
    api('/questions?limit=5').then((res) => setRecentQuestions(res.data || [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {user?.firstName} 👋</h1>
        <p>Here's your competitive programming progress</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Problems Solved</div>
          <div className="stat-value">{analytics?.totalSolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">{user?.currentStreak || 0} 🔥</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">XP Points</div>
          <div className="stat-value">{user?.xp || 0}</div>
          <div className="stat-sub">Level {user?.level || 1}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Longest Streak</div>
          <div className="stat-value">{user?.longestStreak || 0}</div>
          <div className="stat-sub">days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Easy Solved</div>
          <div className="stat-value" style={{ color: 'var(--easy)', background: 'none', WebkitTextFillColor: 'initial' }}>{analytics?.easySolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Medium Solved</div>
          <div className="stat-value" style={{ color: 'var(--medium)', background: 'none', WebkitTextFillColor: 'initial' }}>{analytics?.mediumSolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Hard Solved</div>
          <div className="stat-value" style={{ color: 'var(--hard)', background: 'none', WebkitTextFillColor: 'initial' }}>{analytics?.hardSolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Accuracy</div>
          <div className="stat-value">{analytics?.accuracy || 0}%</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📝 Recent Questions</h2>
        {recentQuestions.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No questions yet. Add some from the Questions page!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Platform</th>
                  <th>Difficulty</th>
                  <th>Topics</th>
                </tr>
              </thead>
              <tbody>
                {recentQuestions.map((q: any) => (
                  <tr key={q._id}>
                    <td>
                      {q.problemUrl ? (
                        <a href={q.problemUrl} target="_blank" rel="noreferrer">{q.title}</a>
                      ) : q.title}
                    </td>
                    <td><span className="badge badge-role">{q.platform}</span></td>
                    <td>
                      <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{q.topics?.slice(0, 3).join(', ')}</td>
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
