import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, DollarSign, Calendar,
  MoreHorizontal, Plus, ArrowUpRight, ArrowDownRight,
  Edit3, Trash2, ExternalLink, Filter,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const EventDashboard = () => {
  const { resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('active');

  const stats = [
    { label: 'Total Revenue', value: '$12,450', grow: '+12.5%', isUp: true, icon: <DollarSign className="text-emerald-500" /> },
    { label: 'Tickets Sold', value: '842', grow: '+5.2%', isUp: true, icon: <Calendar className="text-blue-500" /> },
    { label: 'Avg. Viewers', value: '1.2K', grow: '-2.1%', isUp: false, icon: <Users className="text-purple-500" /> },
    { label: 'Conversion', value: '18%', grow: '+0.4%', isUp: true, icon: <BarChart3 className="text-orange-500" /> },
  ];

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'} pt-24 px-4 md:px-10 pb-10`}>
      <div className="max-w-7xl mx-auto space-y-10">

        {/* 🏆 TOP HEADER SECTION */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/pro/settings')}
            className={`p-2 rounded-lg ${resolvedTheme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
          </button>
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className={`text-3xl font-black ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tighter uppercase`}>Creator Studio</h1>
              <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">Tiger & Light Management Engine</p>
            </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-3 self-start md:self-auto"
          >
            <Plus size={18} strokeWidth={3} /> Create New Event
          </motion.button>
          </div>
        </div>

        {/* 📊 ANALYTICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${resolvedTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} p-6 rounded-[28px] border shadow-sm`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} rounded-xl`}>
                  {stat.icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black ${stat.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.grow}
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className={`text-2xl font-black ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'} mt-1 tracking-tight`}>{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* 📋 MANAGEMENT SECTION */}
        <div className={`${resolvedTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} rounded-[32px] border shadow-sm overflow-hidden`}>
          <div className={`p-8 border-b ${resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-100'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className={`flex gap-2 p-1 ${resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} rounded-xl self-start`}>
              {['active', 'draft', 'past'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab
                    ? `${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-white'} text-blue-600 shadow-sm`
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border ${resolvedTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'} px-4 py-2 rounded-xl hover:bg-slate-50 transition-all`}>
              <Filter size={14} /> Filter Results
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${resolvedTheme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Detail</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${resolvedTheme === 'dark' ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {[1, 2, 3].map((item) => (
                  <tr key={item} className={`group ${resolvedTheme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'} transition-all`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}>
                          <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100" alt="thumb" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className={`text-sm font-black ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-blue-600 transition-colors uppercase tracking-tight`}>Advanced SQL Mastery</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Masterclass • 120min</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className={`text-xs font-bold ${resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-900'} uppercase`}>May 15, 2026</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase rounded-full border border-blue-500/20">
                        Published
                      </span>
                    </td>
                    <td className={`px-8 py-6 text-sm font-black ${resolvedTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>$4,200.00</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <button className={`p-2.5 text-slate-400 hover:text-blue-500 ${resolvedTheme === 'dark' ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50'} rounded-xl transition-all`}>
                          <Edit3 size={18} />
                        </button>
                        <button className={`p-2.5 text-slate-400 ${resolvedTheme === 'dark' ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-100'} rounded-xl transition-all`}>
                          <ExternalLink size={18} />
                        </button>
                        <button className={`p-2.5 text-slate-400 hover:text-red-500 ${resolvedTheme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} rounded-xl transition-all`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDashboard;