import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Briefcase, Users, MapPin, Clock, DollarSign, Plus, Pencil, Trash2
} from 'lucide-react';

const jobTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship'
};

export const JobsTab = ({ jobs, language, handleOpenJobForm, handleDeleteJob }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900" data-testid="jobs-tab-title">
          {language === 'id' ? 'Daftar Lowongan' : 'Job Listings'}
        </h2>
        <Button
          className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
          data-testid="add-job-btn"
          onClick={() => handleOpenJobForm()}
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'id' ? 'Tambah Lowongan' : 'Add Job'}
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500" data-testid="no-jobs-msg">
              {language === 'id' ? 'Belum ada lowongan' : 'No jobs yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="jobs-list">
          {jobs.map(job => (
            <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      <Badge
                        variant={job.status === 'published' ? 'default' : 'secondary'}
                        className={job.status === 'published' ? 'bg-emerald-100 text-emerald-700' : ''}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {job.department && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.department}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </span>
                      {job.show_salary && job.salary_min && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Rp {job.salary_min.toLocaleString()}
                          {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#2E4DA7]">{job.application_count}</p>
                      <p className="text-sm text-gray-500">
                        {language === 'id' ? 'Lamaran' : 'Applications'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`edit-job-${job.id}`}
                        onClick={() => handleOpenJobForm(job)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`delete-job-${job.id}`}
                        onClick={() => handleDeleteJob(job)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
