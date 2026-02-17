import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCount, formatCurrency } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodForm, setMethodForm] = useState({ provider: 'paypal', credentials: '' });

  useEffect(() => {
    Promise.all([
      api.get(`/api/users/${user.username}/analytics`),
      api.get('/api/payments/earnings'),
      api.get('/api/payments/methods'),
    ])
      .then(([analyticsData, earningsData, methodsData]) => {
        setAnalytics(analyticsData.videos);
        setEarnings(earningsData.earnings);
        setMethods(methodsData.methods);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.username]);

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/api/payments/methods', {
        provider: methodForm.provider,
        credentials: { handle: methodForm.credentials },
      });
      setMethods((prev) => [...prev, data.method]);
      setShowAddMethod(false);
      setMethodForm({ provider: 'paypal', credentials: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <h1>Creator Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card card">
          <h3>Total Earnings</h3>
          <p className="stat-value">{formatCurrency(earnings?.total_earnings || 0)}</p>
        </div>
        <div className="stat-card card">
          <h3>Payments Received</h3>
          <p className="stat-value">{earnings?.payment_count || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>Paywall Sales</h3>
          <p className="stat-value">{earnings?.paywall_sales || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>Videos</h3>
          <p className="stat-value">{analytics?.length || 0}</p>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Payment Methods</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddMethod(!showAddMethod)}>
            {showAddMethod ? 'Cancel' : 'Add Method'}
          </button>
        </div>
        {showAddMethod && (
          <form className="add-method-form card" onSubmit={handleAddMethod}>
            <div className="form-row">
              <div className="form-group">
                <label>Provider</label>
                <select
                  value={methodForm.provider}
                  onChange={(e) => setMethodForm({ ...methodForm, provider: e.target.value })}
                >
                  <option value="paypal">PayPal</option>
                  <option value="cashapp">Cash App</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                  <option value="chime">Chime</option>
                </select>
              </div>
              <div className="form-group">
                <label>Handle / Email</label>
                <input
                  type="text"
                  value={methodForm.credentials}
                  onChange={(e) => setMethodForm({ ...methodForm, credentials: e.target.value })}
                  required
                  placeholder="your@email.com or $cashtag"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
          </form>
        )}
        <div className="methods-list">
          {methods.length === 0 ? (
            <p className="muted">No payment methods added yet</p>
          ) : (
            methods.map((m) => (
              <div key={m.id} className="method-item card">
                <span className="method-provider">{m.provider}</span>
                <span className={`method-status ${m.is_active ? 'active' : 'inactive'}`}>
                  {m.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Video Performance</h2>
        {!analytics || analytics.length === 0 ? (
          <p className="muted">No video data yet</p>
        ) : (
          <div className="analytics-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Avg Watch</th>
                  <th>External Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((v) => (
                  <tr key={v.video_id}>
                    <td>{v.title}</td>
                    <td>{formatCount(v.view_count)}</td>
                    <td>{formatCount(v.like_count)}</td>
                    <td>{v.avg_watch_duration}s</td>
                    <td>{formatCount(v.external_view_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
