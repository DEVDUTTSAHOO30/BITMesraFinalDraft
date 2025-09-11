"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import { Calendar, TrendingUp, DollarSign, BarChart3, Search, Filter } from "lucide-react";

export default function SummaryPage() {
  const { user } = useUser();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartView, setChartView] = useState("both");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [animateCharts, setAnimateCharts] = useState(false);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchSummary = async () => {
    if (!user) {
      setError("User not logged in");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both start and end date");
      return;
    }

    setError("");
    setLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await fetch(
        `/api/expenses?userId=${user.id}&startDate=${startDate}&endDate=${endDate}`
      );
      const result = await res.json();

      if (res.ok) {
        if (
          (!result.categoryBreakdown || Object.keys(result.categoryBreakdown).length === 0) &&
          (!result.dailySpending || Object.keys(result.dailySpending).length === 0)
        ) {
          setError("No spending data found for this period");
          setData(null);
        } else {
          setData(result);
          setAnimateCharts(true);
          setTimeout(() => setAnimateCharts(false), 1000);
        }
      } else {
        setError(result.error || "Failed to fetch data");
        setData(null);
      }
    } catch (e) {
      setError("Connection error. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on date change
  useEffect(() => {
    if (startDate && endDate && user) {
      const timer = setTimeout(fetchSummary, 500);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, user]);

  const COLORS = ["#FF8C00", "#FF6B35", "#FFA500", "#FF7F50", "#FFB84D", "#FF9500"];

  const totalExpenses = data ? 
    Object.values(data.categoryBreakdown || {}).reduce((sum, val) => sum + val, 0) : 0;

  const avgDaily = data && Object.keys(data.dailySpending || {}).length > 0 ? 
    totalExpenses / Object.keys(data.dailySpending).length : 0;

  const handleCategoryClick = (entry) => {
    setSelectedCategory(selectedCategory === entry.name ? null : entry.name);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-orange-500 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-orange-400">
            Amount: <span className="text-white font-bold">${payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "orange" }) => (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
      <div className="flex items-center space-x-3">
        <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-white text-xl font-bold">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-orange-500/20 rounded-lg"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-gray-700 rounded"></div>
                <div className="w-16 h-5 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="w-32 h-6 bg-gray-700 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-800 rounded"></div>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
          <div className="w-28 h-6 bg-gray-700 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent">
              Expense Summary
            </h1>
            <p className="text-gray-400">Track and analyze your spending patterns</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-400">Financial Overview</span>
          </div>
        </div>

        {/* Date Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-400 flex items-center space-x-2">
              <span className="w-5 h-5 text-red-500">⚠</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Data Display */}
        {data && !loading && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={DollarSign}
                title="Total Expenses"
                value={`$${totalExpenses.toFixed(2)}`}
                subtitle={`${Object.keys(data.categoryBreakdown || {}).length} categories`}
              />
              <StatCard
                icon={TrendingUp}
                title="Daily Average"
                value={`$${avgDaily.toFixed(2)}`}
                subtitle={`Over ${Object.keys(data.dailySpending || {}).length} days`}
              />
              <StatCard
                icon={BarChart3}
                title="Top Category"
                value={Object.keys(data.categoryBreakdown || {}).length > 0 ? 
                  Object.entries(data.categoryBreakdown).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'N/A'}
                subtitle={Object.keys(data.categoryBreakdown || {}).length > 0 ? 
                  `$${Object.entries(data.categoryBreakdown).reduce((a, b) => a[1] > b[1] ? a : b)[1].toFixed(2)}` : ''}
              />
            </div>

            {/* Chart View Toggle */}
            <div className="flex justify-center">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-1">
                {["both", "category", "daily"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setChartView(view)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      chartView === view
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {view === "both" ? "Both Charts" : view === "category" ? "Categories" : "Daily Trend"}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className={`grid gap-8 ${chartView === "both" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {/* Category Breakdown */}
              {(chartView === "both" || chartView === "category") && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Category Breakdown</span>
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={Object.entries(data.categoryBreakdown).map(([cat, amt]) => ({
                          name: cat,
                          value: amt,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({name, value}) => `${name}: $${value.toFixed(0)}`}
                        onClick={handleCategoryClick}
                        animationBegin={animateCharts ? 0 : undefined}
                        animationDuration={800}
                      >
                        {Object.keys(data.categoryBreakdown).map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                            stroke={selectedCategory === Object.keys(data.categoryBreakdown)[idx] ? "#fff" : "none"}
                            strokeWidth={selectedCategory === Object.keys(data.categoryBreakdown)[idx] ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Daily Spending */}
              {(chartView === "both" || chartView === "daily") && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-colors">
                  <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Daily Spending Trend</span>
                  </h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={Object.entries(data.dailySpending).map(([day, amt]) => ({
                        day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        amount: amt,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="amount" 
                        fill="#FF8C00"
                        radius={[4, 4, 0, 0]}
                        animationBegin={animateCharts ? 0 : undefined}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}