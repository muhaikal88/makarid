import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Briefcase, Eye, FileText, Clock, Globe, Copy, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export const OverviewTab = ({ stats, applications, session, language, formatDate, getInitials }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Total Lowongan' : 'Total Jobs'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Briefcase className="w-6 h-6 text-[#2E4DA7]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Lowongan Aktif' : 'Active Jobs'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.publishedJobs}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Eye className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Total Lamaran' : 'Total Applications'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplications}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {language === 'id' ? 'Menunggu Review' : 'Pending Review'}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingApplications}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Careers Page Link */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Globe className="w-6 h-6 text-[#2E4DA7]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {language === 'id' ? 'Link Halaman Karir Anda' : 'Your Careers Page Link'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {language === 'id'
                    ? 'Bagikan link ini ke kandidat untuk melihat lowongan Anda'
                    : 'Share this link with candidates to view your job openings'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Default URL:</span>
                    <code className="flex-1 px-3 py-2 bg-white rounded-lg text-sm font-mono text-[#2E4DA7] border">
                      {session?.company_slug}.makar.id
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="copy-default-url-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://${session?.company_slug}.makar.id`);
                        toast.success('Link disalin!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {session?.custom_domain && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-600">Custom Domain:</span>
                      <code className="flex-1 px-3 py-2 bg-white rounded-lg text-sm font-mono text-emerald-600 border border-emerald-200">
                        {session?.custom_domain}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="copy-custom-domain-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://${session?.custom_domain}`);
                          toast.success('Link disalin!');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              data-testid="open-careers-page-btn"
              onClick={() => window.open(`/careers/${session?.company_slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'id' ? 'Buka' : 'Open'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle data-testid="recent-applications-title">
            {language === 'id' ? 'Lamaran Terbaru' : 'Recent Applications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-center text-gray-500 py-8" data-testid="no-applications-msg">
              {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
            </p>
          ) : (
            <div className="space-y-4" data-testid="recent-applications-list">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="bg-[#2E4DA7]">
                      <AvatarFallback className="bg-[#2E4DA7] text-white">
                        {getInitials(app.applicant_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{app.applicant_name}</p>
                      <p className="text-sm text-gray-500">{app.job_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                      {app.status}
                    </Badge>
                    <span className="text-sm text-gray-400">{formatDate(app.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
