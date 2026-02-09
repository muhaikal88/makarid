import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileText, ChevronRight, GitCompareArrows, X, Trash2 } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export const ApplicationsTab = ({
  filteredApplications,
  applications,
  jobs,
  filterStatus,
  setFilterStatus,
  filterJob,
  setFilterJob,
  filterDepartment,
  setFilterDepartment,
  searchApp,
  setSearchApp,
  language,
  handleOpenAppDetail,
  handleCompare,
  handleDeleteApp,
  getInitials,
  formatDate
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const departments = useMemo(() => {
    const depts = new Set();
    jobs.forEach(j => { if (j.department) depts.add(j.department); });
    return [...depts].sort();
  }, [jobs]);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedApps = filteredApplications.filter(a => selectedIds.has(a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" data-testid="applications-tab-title">
          {language === 'id' ? 'Daftar Lamaran' : 'Applications'}
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({filteredApplications.length})
          </span>
        </h2>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="filter-status-select">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterJob} onValueChange={setFilterJob}>
          <SelectTrigger className="w-48" data-testid="filter-job-select">
            <SelectValue placeholder="Posisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Posisi</SelectItem>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {departments.length > 0 && (
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48" data-testid="filter-department-select">
              <SelectValue placeholder="Departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          placeholder="Cari nama atau email..."
          value={searchApp}
          onChange={(e) => setSearchApp(e.target.value)}
          className="w-64"
          data-testid="search-applications-input"
        />
      </div>

      {/* Hint */}
      {filteredApplications.length > 1 && selectedIds.size === 0 && (
        <p className="text-xs text-gray-400">
          {language === 'id' ? 'Centang lamaran untuk membandingkan' : 'Check applications to compare'}
        </p>
      )}

      {filteredApplications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500" data-testid="no-applications-msg">
              {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="applications-list">
          {filteredApplications.map(app => {
            const isChecked = selectedIds.has(app.id);
            return (
              <Card
                key={app.id}
                className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isChecked ? 'ring-2 ring-[#2E4DA7] bg-blue-50/30' : ''}`}
                data-testid={`application-card-${app.id}`}
                onClick={() => handleOpenAppDetail(app)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div onClick={(e) => toggleSelect(app.id, e)} className="shrink-0">
                        <Checkbox
                          checked={isChecked}
                          data-testid={`compare-check-${app.id}`}
                          className="border-gray-300"
                        />
                      </div>
                      <Avatar className="w-12 h-12 bg-[#2E4DA7]">
                        <AvatarFallback className="bg-[#2E4DA7] text-white">
                          {getInitials(app.applicant_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-900">{app.applicant_name}</h3>
                        <p className="text-sm text-gray-500">{app.applicant_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#2E4DA7]">{app.job_title}</p>
                          {app.job_department && (
                            <span className="text-xs text-gray-400">/ {app.job_department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                          {app.status}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(app.created_at)}</p>
                      </div>
                      {app.resume_url && (
                        <a
                          href={`${process.env.REACT_APP_BACKEND_URL}${app.resume_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`download-resume-${app.id}`}
                        >
                          <FileText className="w-5 h-5 text-gray-600" />
                        </a>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Compare Bar */}
      {selectedIds.size >= 2 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2E4DA7] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4"
          data-testid="compare-bar"
        >
          <div className="flex items-center gap-3">
            {selectedApps.slice(0, 4).map(app => (
              <Avatar key={app.id} className="w-8 h-8 border-2 border-white -ml-2 first:ml-0">
                <AvatarFallback className="bg-white text-[#2E4DA7] text-xs font-bold">
                  {getInitials(app.applicant_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            <span className="text-sm font-medium ml-1">
              {selectedIds.size} dipilih
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-[#2E4DA7] hover:bg-white/90 font-semibold"
            data-testid="compare-btn"
            onClick={() => handleCompare([...selectedIds])}
          >
            <GitCompareArrows className="w-4 h-4 mr-1.5" />
            Bandingkan
          </Button>

          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="clear-selection-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
