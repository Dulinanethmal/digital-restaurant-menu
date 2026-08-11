import { useState, useEffect } from "react";
import supabase from "./supabase"; 
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

const COLORS = ['#F4B400', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export default function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState("Today");
  const [loading, setLoading] = useState(true);

  // 1. Grab the specific restaurant's ID from the admin session
  const session = JSON.parse(localStorage.getItem("custom_session") || "{}");
  const shopId = session.shop_id;

  // Dynamic Data States
  const [kpis, setKpis] = useState({ revenue: 0, total: 0, avg: 0, completed: 0, cancelled: 0, refunds: 0 });
  const [bestSellers, setBestSellers] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);

  useEffect(() => {
    if (!shopId) {
      console.error("No shop ID found in session.");
      setLoading(false);
      return;
    }
    fetchAnalyticsData();
  }, [dateRange, shopId]); // Added shopId to dependencies

  async function fetchAnalyticsData() {
    setLoading(true);

    // 1. Calculate Date Bounds based on Dropdown
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateRange === "Today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === "Yesterday") {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === "Last 7 Days") {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === "This Month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date("2020-01-01"); // Custom/All Time fallback
    }

    // 2. Fetch Orders securely for THIS shop only
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("shop_id", shopId) // MUST INCLUDE THIS to prevent leaking other restaurants' data
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
      return;
    }

    processOrders(orders || []);
    setLoading(false);
  }

  function processOrders(orders) {
    let totalRevenue = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let refundAmount = 0;
    
    let itemsMap = {};
    let revenueByHour = {};
    let paymentsMap = { "Cash": 0, "Card": 0, "Online": 0 }; // Default categories

    orders.forEach(order => {
      const amount = Number(order.total_amount) || 0;
      
      // Calculate KPIs
      if (order.status === "Completed" || order.status === "Served") {
        totalRevenue += amount;
        completedCount++;
      } else if (order.status === "Cancelled") {
        cancelledCount++;
      } else if (order.status === "Refunded") {
        refundAmount += amount;
      }

      // Process Items for Best Sellers (Only for valid items array)
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!itemsMap[item.name]) {
            itemsMap[item.name] = { name: item.name, sold: 0, revenue: 0, image: "🍽️" };
          }
          itemsMap[item.name].sold += Number(item.quantity);
          itemsMap[item.name].revenue += (Number(item.price) * Number(item.quantity));
        });
      }

      // Process Revenue Chart Data (Grouping by Hour for simplicity)
      const orderHour = new Date(order.created_at).getHours();
      const formatHour = orderHour > 12 ? `${orderHour - 12} PM` : orderHour === 0 ? "12 AM" : `${orderHour} AM`;
      if (!revenueByHour[formatHour]) revenueByHour[formatHour] = { time: formatHour, revenue: 0, orders: 0 };
      revenueByHour[formatHour].revenue += amount;
      revenueByHour[formatHour].orders += 1;

      // Process Payment Distribution
      const method = order.payment_method || (order.payment_status === "Paid" ? "Card" : "Cash"); // Fallback if you don't have payment_method column
      if (paymentsMap[method] !== undefined) {
        paymentsMap[method] += amount;
      } else {
        paymentsMap["Cash"] += amount; // Fallback
      }
    });

    // Update States
    setKpis({
      revenue: totalRevenue,
      total: orders.length,
      avg: orders.length > 0 ? (totalRevenue / orders.length) : 0,
      completed: completedCount,
      cancelled: cancelledCount,
      refunds: refundAmount
    });

    // Sort Best Sellers by Quantity Sold (Top 5)
    const sortedItems = Object.values(itemsMap).sort((a, b) => b.sold - a.sold).slice(0, 5);
    setBestSellers(sortedItems);

    // Format Chart Data
    setRevenueData(Object.values(revenueByHour));
    
    // Format Payment Data (filter out zeros to keep pie chart clean)
    const formattedPayments = Object.keys(paymentsMap)
      .map(key => ({ name: key, value: paymentsMap[key] }))
      .filter(p => p.value > 0);
    setPaymentData(formattedPayments.length > 0 ? formattedPayments : [{ name: "No Data", value: 1 }]);
  }

  const handleExport = (type) => alert(`Exporting ${type} for ${dateRange}...`);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-sub">Monitor your real-time performance</p>
        </div>
        <div className="header-actions">
          <select className="date-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>
          <button className="btn-outline" onClick={() => handleExport('Full Report')}>↓ Export Report</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>Loading your analytics...</div>
      ) : (
        <>
          <div className="kpi-grid">
            <KpiCard title="Total Revenue" value={`$${kpis.revenue.toFixed(2)}`} />
            <KpiCard title="Total Orders" value={kpis.total} />
            <KpiCard title="Avg Order Value" value={`$${kpis.avg.toFixed(2)}`} />
            <KpiCard title="Completed Orders" value={kpis.completed} />
            <KpiCard title="Cancelled Orders" value={kpis.cancelled} />
            <KpiCard title="Total Refunds" value={`$${kpis.refunds.toFixed(2)}`} />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Revenue Trend</h3>
              </div>
              <div className="chart-container">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      <Line type="monotone" dataKey="revenue" stroke="#F4B400" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#999" }}>No revenue data for this period</div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>Payment Distribution</h3>
              <div className="chart-container pie-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {paymentData.filter(p => p.name !== "No Data").map((entry, index) => (
                    <div key={entry.name} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: COLORS[index] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lists-grid">
            <div className="list-card">
              <div className="chart-header">
                <h3>Best-Selling Items</h3>
                <button className="btn-text" onClick={() => handleExport('Menu Performance')}>Export</button>
              </div>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty Sold</th>
                    <th style={{ textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.length > 0 ? bestSellers.map((item, idx) => (
                    <tr key={idx}>
                      <td className="item-cell">
                        <span className="item-icon">{item.image}</span>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.sold}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>${item.revenue.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#999" }}>No items sold in this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="list-card">
              <div className="chart-header">
                <h3>Order Status Analytics</h3>
                <button className="btn-text" onClick={() => handleExport('Order Status')}>Export</button>
              </div>
              <div className="status-bars">
                <StatusBar label="Completed" value={kpis.completed} total={kpis.total} color="#10B981" />
                <StatusBar label="Cancelled" value={kpis.cancelled} total={kpis.total} color="#EF4444" />
                <StatusBar label="Pending / Other" value={kpis.total - kpis.completed - kpis.cancelled} total={kpis.total} color="#F59E0B" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Keep the sub-components exactly the same
function KpiCard({ title, value }) {
  return (
    <div className="kpi-card">
      <span className="kpi-title">{title}</span>
      <h3 className="kpi-value">{value}</h3>
    </div>
  );
}

function StatusBar({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="status-bar-wrapper">
      <div className="status-bar-header">
        <span>{label}</span>
        <span>{value} ({percentage}%)</span>
      </div>
      <div className="status-bar-bg">
        <div className="status-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
}