import { useState, useEffect, useMemo } from 'react';
import { getHeatmapData } from '../../services/api';
import HeatmapChart from '../../components/HeatmapChart';
import FilterBar from '../../components/FilterBar';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function Heatmap({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    getHeatmapData()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => [...new Set(data.map(d => d.category).filter(Boolean))], [data]);
  const skills = useMemo(() => [...new Set(data.map(d => d.skill_name))], [data]);

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedCategory) result = result.filter(d => d.category === selectedCategory);
    if (selectedSkill) result = result.filter(d => d.skill_name === selectedSkill);
    return result;
  }, [data, selectedCategory, selectedSkill]);

  const handleFilterChange = (key, value) => {
    if (key === 'category') setSelectedCategory(value);
    if (key === 'skill') setSelectedSkill(value);
  };

  // Quick stats
  const avgScore = filteredData.length > 0
    ? Math.round(filteredData.reduce((s, d) => s + d.total_score, 0) / filteredData.length)
    : 0;
  const highCount = filteredData.filter(d => d.total_score >= 75).length;
  const lowCount = filteredData.filter(d => d.total_score < 50).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-7 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Skill Heatmap</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {user?.role === 'student'
              ? 'Your performance across all skills'
              : 'Student performance overview'}
          </p>
        </div>
        <FilterBar
          filters={{ skills, categories, selectedSkill, selectedCategory }}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center card-hover">
          <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Average Score</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center card-hover">
          <p className="text-2xl font-bold text-emerald-600">{highCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Strong Scores</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center card-hover">
          <p className="text-2xl font-bold text-orange-600">{lowCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Needs Attention</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <HeatmapChart data={filteredData} />
      </div>
    </div>
  );
}
